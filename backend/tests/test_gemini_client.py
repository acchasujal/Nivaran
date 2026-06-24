import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from pydantic import BaseModel
from fastapi import HTTPException
from app.services.gemini_client import GeminiClient

class DummySchema(BaseModel):
    name: str
    value: int

@pytest.mark.asyncio
async def test_successful_generate_structured_output():
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = '{"name": "test", "value": 42}'
    
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response
    
    mock_client = MagicMock()
    mock_client.aio.models = mock_models
    
    # Initialize client with mock
    client = GeminiClient(client=mock_client)
    
    result = await client.generate_structured_output(
        prompt="hello",
        response_schema=DummySchema
    )
    
    assert isinstance(result, DummySchema)
    assert result.name == "test"
    assert result.value == 42
    
    # Check generate_content called once
    mock_models.generate_content.assert_called_once()

@pytest.mark.asyncio
async def test_retry_on_validation_failure_then_success():
    # First call returns malformed JSON, second call returns correct JSON
    mock_response_1 = MagicMock()
    mock_response_1.text = '{"name": "test"}'  # missing "value" field, validation error
    
    mock_response_2 = MagicMock()
    mock_response_2.text = '{"name": "test", "value": 100}'
    
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [mock_response_1, mock_response_2]
    
    mock_client = MagicMock()
    mock_client.aio.models = mock_models
    
    client = GeminiClient(client=mock_client)
    
    result = await client.generate_structured_output(
        prompt="hello",
        response_schema=DummySchema
    )
    
    assert isinstance(result, DummySchema)
    assert result.value == 100
    # generate_content called twice (one initial + one retry)
    assert mock_models.generate_content.call_count == 2

@pytest.mark.asyncio
async def test_failed_twice_raises_502():
    # Both calls return malformed JSON
    mock_response = MagicMock()
    mock_response.text = '{"name": "test"}' # invalid
    
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response
    
    mock_client = MagicMock()
    mock_client.aio.models = mock_models
    
    client = GeminiClient(client=mock_client)
    
    with pytest.raises(HTTPException) as excinfo:
        await client.generate_structured_output(
            prompt="hello",
            response_schema=DummySchema
        )
        
    assert excinfo.value.status_code == 502
    assert excinfo.value.detail == {"error": "ai_unavailable", "retryable": True}
    assert mock_models.generate_content.call_count == 2

@pytest.mark.asyncio
async def test_timeout_enforcement():
    # Mock models generate_content to sleep for longer than timeout
    async def slow_generate(*args, **kwargs):
        await asyncio.sleep(2.0)
        mock_response = MagicMock()
        mock_response.text = '{"name": "test", "value": 42}'
        return mock_response
        
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = slow_generate
    
    mock_client = MagicMock()
    mock_client.aio.models = mock_models
    
    client = GeminiClient(client=mock_client)
    
    # Run with 0.5s timeout, expecting timeout error and retry, then another timeout and 502
    with pytest.raises(HTTPException) as excinfo:
        await client.generate_structured_output(
            prompt="hello",
            response_schema=DummySchema,
            timeout=0.5
        )
        
    assert excinfo.value.status_code == 502
    assert excinfo.value.detail == {"error": "ai_unavailable", "retryable": True}
    assert mock_models.generate_content.call_count == 2
