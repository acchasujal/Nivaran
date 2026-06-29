import datetime

def build_complaint_document(
    municipal_header: str,
    ref_id: str,
    recipient: str,
    subject: str,
    formal_body: str,
    attachments: list[str],
    ledger_url: str,
    signature: str = "Sincerely,\nConcerned Citizens of CivicPulse"
) -> str:
    attachments_str = "\n".join(f"| {i+1}. {a:<32} | Logged & Verified (Agent 1 Vision)   |" for i, a in enumerate(attachments))
    current_date = datetime.datetime.now().strftime("%d-%b-%Y")
    
    policy_complaint_note = (
        "\n\n================================================================================\n"
        "PUBLIC GRIEVANCE REDRESSAL REFERENCE POLICY:\n"
        "In accordance with standard government grievance guidelines (Department of Administrative\n"
        "Reforms and Public Grievances - DARPG / CPGRAMS), public infrastructure failures must be\n"
        "addressed in a time-bound manner by the responsible municipal authority.\n"
        "================================================================================"
    )
    
    body = f"""================================================================================
                    MUNICIPAL CORPORATION OF GREATER MUMBAI
                 OFFICE OF THE EXECUTIVE ENGINEER (CIVIC WORKS)
================================================================================
Ref No: MCGM/GR-CIVIC/{ref_id}                                Date: {current_date}

To,
    {recipient.replace('\n', '\n    ')}

SUBJECT: {subject.upper()}

Respected Sir/Madam,

1. Grievance Reference and Context:
   {formal_body}

2. Statutory Timeline and Public Grievance Charter:
   Under the Municipal Corporation Grievance Redressal guidelines and the Department 
   of Administrative Reforms and Public Grievances (DARPG) Citizens Charter, 
   infrastructure safety hazards must be inspected and rectified in a time-bound 
   manner by the municipal engineering department.

3. Verified Supporting Evidence:
   +------------------------------------+--------------------------------------+
   | EVIDENCE / DOCUMENT DESCRIPTION    | VERIFICATION STATUS                  |
   +------------------------------------+--------------------------------------+
{attachments_str}
   | Public Ledger Entry                | Registered on CivicPulse             |
   +------------------------------------+--------------------------------------+

4. Public Tracking URL:
   {ledger_url}

Respectfully submitted,

{signature}

Copy forwarded for information and necessary action to:
1. The Office of the Municipal Commissioner, Grievance Cell, Mumbai.
2. The Chief Vigilance Officer (CVO), Infrastructure Monitoring Division.
3. CivicPulse Public Accountability Archive."""

    return body + policy_complaint_note
