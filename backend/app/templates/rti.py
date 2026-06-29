import datetime

def build_rti_document(
    pio_designation: str,
    authority: str,
    subject: str,
    questions: list[str],
    declaration: str = "Declaration: I am a citizen of India and the requested information falls within the purview of the RTI Act 2005.",
    signature: str = "Respectfully submitted,\nApplicant",
    ref_id: str = "RTI-DEFAULT"
) -> str:
    questions_str = "\n".join(f"   {i+1}. {q}" for i, q in enumerate(questions))
    current_date = datetime.datetime.now().strftime("%d-%b-%Y")
    
    policy_rti_note = (
        "\n\n================================================================================\n"
        "RTI ACT 2005 STATUTORY COMPLIANCE NOTE:\n"
        "Under Section 7(1) of the Right to Information (RTI) Act, 2005, public authorities are\n"
        "statutorily required to respond to information requests concerning public infrastructure\n"
        "and maintenance records within 30 days of receipt.\n"
        "================================================================================"
    )
    
    body = f"""================================================================================
                     RTI ACT 2005 - FORM A (RTI APPLICATION)
                         (See Rule 3(1) of the RTI Rules)
================================================================================
AI-generated draft. Review before submission.

Ref No: RTI/APP/2026/{ref_id}                                 Date: {current_date}

To,
    The Public Information Officer (PIO),
    {pio_designation},
    {authority},
    Mumbai, Maharashtra.

SUBJECT: APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

Respected Sir/Madam,

1. Full Name of Applicant   : CivicPulse Representative (Concerned Resident)
2. Citizenship Status       : Citizen of India (Mandatory Declaration)
3. Information Requested    :
   Pursuant to Section 6(1) of the RTI Act 2005, please provide the following details 
   concerning maintenance and contractor records for the infrastructure issue:

{questions_str}

4. Subject Period           : Current Fiscal Year (to date)
5. Mode of Delivery         : Electronic / Speed Post
6. Fee Details              : Statutory fee of Rs. 10/- is payable upon final 
                              submission/e-filing.

DECLARATION:
I hereby declare that I am a citizen of India and the requested information falls 
entirely within the purview of the Right to Information Act, 2005.

Respectfully submitted,

{signature}

Address for Communication:
CivicPulse Public Accountability Ledger Archive
Web: https://civicpulse.org"""

    return body + policy_rti_note
