import os
import asyncio
import json
from pydantic import BaseModel, Field
from typing import List, Literal
from app.services.gemini_client import GeminiClient

# Define the Agent 1 schema from AI_SYSTEM_DESIGN.md
class Agent1Output(BaseModel):
    issue_type: Literal["road_damage", "lighting", "water", "waste", "other"]
    severity: int = Field(..., ge=1, le=5)
    description: str = Field(..., max_length=280)
    credibility_score: float = Field(..., ge=0.0, le=1.0)
    image_flags: List[Literal["clear", "blurry", "duplicate_visual", "low_confidence"]]

async def main():
    print("--- 1. Request Setup ---")
    # Read backend/.env manually to ensure we get the keys
    env_path = ".env"
    api_keys = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEYS="):
                    api_keys = line.strip().split("=")[1].split(",")
                    break

    if not api_keys:
        print("Error: Real Gemini API keys not found in backend/.env")
        return

    print(f"Loaded {len(api_keys)} API keys from .env")
    
    image_path = "civic_issue_pothole.png"
    if not os.path.exists(image_path):
        print(f"Error: Civic image {image_path} not found.")
        return
        
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    print(f"Image loaded: {image_path} ({len(image_bytes)} bytes)")
    
    prompt = "Classify this civic infrastructure issue."
    system_instruction = (
        "You are Agent 1 (Issue Understanding) for CivicPulse. Analyze the provided image of a civic issue. "
        "Provide a structured classification. Assess the severity (1-5), describe the issue in <= 280 characters, "
        "and calculate a credibility score (0.0-1.0) based strictly on image quality, clarity, and classification confidence."
    )
    
    print(f"System Instruction: {system_instruction}")
    print(f"Prompt: {prompt}")
    
    models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-3.5-flash"]
    success = False
    
    # Try keys and models sequentially
    for idx, api_key in enumerate(api_keys):
        masked_key = f"{api_key[:5]}...{api_key[-5:]}"
        print(f"\n======================================")
        print(f"Attempting Key {idx + 1}/{len(api_keys)}: {masked_key}")
        print(f"======================================")
        
        for model in models:
            print(f"\n--> Trying model: {model}")
            try:
                client = GeminiClient(api_key=api_key)
                
                contents = [prompt]
                from google.genai import types
                contents.append(
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/png"
                    )
                )
                
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=Agent1Output,
                    system_instruction=system_instruction
                )
                
                print("Sending request...")
                response = await client.client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                
                raw_text = response.text
                print("\n--- 2. Sending Request to Gemini ---")
                print(f"Success using key {idx + 1} and model {model}")
                
                print("\n--- 3. Raw Gemini Response ---")
                print(raw_text)
                
                print("\n--- 4. Parsed JSON ---")
                try:
                    parsed_json = json.loads(raw_text)
                    print(json.dumps(parsed_json, indent=2))
                except Exception as e:
                    print(f"Failed to parse raw response as JSON: {e}")
                    parsed_json = None
                    
                print("\n--- 5. Validation Result ---")
                try:
                    validated = Agent1Output.model_validate_json(raw_text)
                    print("Validation: SUCCESS")
                    print(f"Validated Model Object: {validated}")
                    
                    # Write evidence to a file
                    evidence = {
                        "request": {
                            "prompt": prompt,
                            "system_instruction": system_instruction,
                            "image": image_path,
                            "key_index": idx + 1,
                            "model_used": model
                        },
                        "raw_response": raw_text,
                        "parsed_json": parsed_json,
                        "validation": {
                            "success": True,
                            "object": validated.model_dump()
                        }
                    }
                    with open("b1_verification_evidence.json", "w") as ef:
                        json.dump(evidence, ef, indent=2)
                    print("\nEvidence saved to b1_verification_evidence.json")
                    success = True
                    break
                except Exception as e:
                    print("Validation: FAILED")
                    print(f"Validation Error: {e}")
                    
            except Exception as e:
                print(f"API call failed for model {model} using Key {idx + 1}: {e}")
                
        if success:
            break
            
    if not success:
        print("\nAll keys and models attempted and failed to execute successfully.")

if __name__ == "__main__":
    asyncio.run(main())
