import json
import os

# ========== STATIC DATA ==========

PATHOGENS = [
    {
        "name": "E. coli (чувств.)",
        "risk_group": "low_risk",
        "sensitivity": {"цефтриаксон": "S", "амоксициллин/клавуланат": "S", "меропенем": "S"},
    },
    {
        "name": "E. coli (ESBL)",
        "risk_group": "late_nosocomial_mrsa",
        "sensitivity": {"цефтриаксон": "R", "меропенем": "S", "амикацин": "S"},
    },
    {
        "name": "K. pneumoniae (ESBL)",
        "risk_group": "late_nosocomial_mrsa",
        "sensitivity": {"цефтриаксон": "R", "меропенем": "S", "амикацин": "S"},
    },
    {
        "name": "P. aeruginosa (чувств.)",
        "risk_group": "late_nosocomial_pseudomonas",
        "sensitivity": {"пиперациллин/тазобактам": "S", "меропенем": "S", "цефепим": "S", "амикацин": "S"},
    },
    {
        "name": "P. aeruginosa (MDR)",
        "risk_group": "late_nosocomial_pseudomonas",
        "sensitivity": {"пиперациллин/тазобактам": "R", "меропенем": "I", "цефепим": "R", "амикацин": "S", "колистин": "S"},
    },
    {
        "name": "S. aureus (MRSA)",
        "risk_group": "late_nosocomial_mrsa",
        "sensitivity": {"оксациллин": "R", "ванкомицин": "S", "линезолид": "S"},
    },
    {
        "name": "S. aureus (MSSA)",
        "risk_group": "low_risk",
        "sensitivity": {"оксациллин": "S", "цефтриаксон": "S", "ванкомицин": "S"},
    },
]

PATHOGEN_NAMES = [p["name"] for p in PATHOGENS]

DRUGS = {
    "цефтриаксон": {
        "dose": "1-2 г в/в 1 р/сут",
        "renal_adjustment": "Клир. креат. >30: без изменений; <30: 1 г/сут",
    },
    "меропенем": {
        "dose": "1 г в/в 3 р/сут (до 2 г 3 р/сут)",
        "renal_adjustment": "Клир. креат. 26-50: 1 г 2 р/сут; 10-25: 0.5 г 2 р/сут; <10: 0.5 г 1 р/сут",
    },
    "пиперациллин/тазобактам": {
        "dose": "4.5 г в/в 3-4 р/сут",
        "renal_adjustment": "Клир. креат. 20-40: 4.5 г 2 р/сут; <20: 4.5 г 1 р/сут",
    },
    "ванкомицин": {
        "dose": "15-20 мг/кг каждые 8-12ч, мониторинг",
        "renal_adjustment": "Коррекция по клиренсу креатинина (интервал)",
    },
    "линезолид": {
        "dose": "600 мг в/в или внутрь 2 р/сут",
        "renal_adjustment": "Коррекции не требуется",
    },
    "левофлоксацин": {
        "dose": "500 мг 1-2 р/сут",
        "renal_adjustment": "Клир. креат. 20-49: 250 мг 1-2 р/сут; <20: 250 мг 1 р/сут",
    },
    "амикацин": {
        "dose": "15-20 мг/кг 1 р/сут",
        "renal_adjustment": "Удлинение интервала при клир. <60",
    },
    "цефепим": {
        "dose": "1-2 г в/в 2-3 р/сут",
        "renal_adjustment": "Клир. креат. 30-60: 1-2 г 2 р/сут; 11-29: 1-2 г 1 р/сут; <10: 0.5-1 г 1 р/сут",
    },
    "метронидазол": {
        "dose": "500 мг в/в 3 р/сут",
        "renal_adjustment": "Коррекции не требуется",
    },
    "амоксициллин/клавуланат": {
        "dose": "1.2 г в/в 3 р/сут",
        "renal_adjustment": "Клир. креат. <30: 1.2 г 2 р/сут",
    },
    "оксациллин": {
        "dose": "2 г в/в 4-6 р/сут",
        "renal_adjustment": "Коррекции не требуется",
    },
    "колистин": {
        "dose": "9 млн МЕ нагрузочная, затем 4.5 млн МЕ 2 р/сут",
        "renal_adjustment": "Коррекция по клиренсу креатинина",
    },
}


# ========== HELPER FUNCTIONS ==========

def find_pathogen(pathogen_name):
    """Find pathogen data by name."""
    for p in PATHOGENS:
        if p["name"] == pathogen_name:
            return p
    return None


def get_recommendations_for_pathogen(pathogen_data, allergy, crcl):
    """Build targeted therapy recommendations based on sensitivity profile."""
    sensitivity = pathogen_data["sensitivity"]
    recommendations = []

    for drug_name, status in sensitivity.items():
        if status == "R":
            continue  # Skip resistant drugs

        drug_info = DRUGS.get(drug_name)
        if drug_info is None:
            # Drug not in our dosing table - still recommend with basic info
            rec = {
                "drug": drug_name,
                "sensitivity": status,
                "dose": "Дозировка не указана",
                "renal_adjustment": "Нет данных",
            }
        else:
            rec = {
                "drug": drug_name,
                "sensitivity": status,
                "dose": drug_info["dose"],
                "renal_adjustment": drug_info["renal_adjustment"],
            }

        # Mark intermediate sensitivity
        if status == "I":
            rec["note"] = "Промежуточная чувствительность — использовать с осторожностью, увеличить дозу"

        recommendations.append(rec)

    # Sort: S first, then I
    recommendations.sort(key=lambda r: 0 if r.get("sensitivity") == "S" else 1)

    return recommendations


def check_allergy_alert(drug_names, allergy_history):
    """Check for cross-allergy warnings."""
    if not allergy_history or allergy_history.lower() == "нет":
        return None
    allergy_lower = allergy_history.lower()
    warnings = []
    for drug in drug_names:
        if "пенициллин" in allergy_lower and drug.lower() in [
            "амоксициллин/клавуланат",
            "пиперациллин/тазобактам",
        ]:
            warnings.append(f"Перекрёстная аллергия на {drug} (пенициллины)")
        if "цефалоспорин" in allergy_lower and drug.lower() in [
            "цефтриаксон",
            "цефепим",
        ]:
            warnings.append(f"Перекрёстная аллергия на {drug} (цефалоспорины)")
    return warnings if warnings else None


# ========== RESPONSE HELPERS ==========

def make_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }


# ========== MAIN HANDLER ==========

def handler(event: dict, context) -> dict:
    method = event.get("httpMethod", event.get("method", "GET")).upper()

    # CORS preflight
    if method == "OPTIONS":
        return make_response(200, {"status": "ok"})

    # GET: return available pathogens
    if method == "GET":
        return make_response(200, {
            "pathogens": PATHOGEN_NAMES,
            "pathogen_details": [
                {
                    "name": p["name"],
                    "risk_group": p["risk_group"],
                    "sensitivity_profile": p["sensitivity"],
                }
                for p in PATHOGENS
            ],
        })

    # POST: compute targeted recommendation
    if method == "POST":
        try:
            body = json.loads(event.get("body", "{}"))
        except (json.JSONDecodeError, TypeError):
            return make_response(400, {"error": "Invalid JSON body"})

        pathogen_name = body.get("pathogen")
        allergy = body.get("allergy", "")
        crcl = body.get("crcl")

        # Validate
        if not pathogen_name:
            return make_response(400, {"error": "pathogen is required"})

        pathogen_data = find_pathogen(pathogen_name)
        if pathogen_data is None:
            return make_response(400, {
                "error": f"Unknown pathogen: {pathogen_name}",
                "available_pathogens": PATHOGEN_NAMES,
            })

        # Build recommendations
        recommendations = get_recommendations_for_pathogen(pathogen_data, allergy, crcl)

        # Check allergy for recommended drugs
        recommended_drug_names = [r["drug"] for r in recommendations]
        allergy_warnings = check_allergy_alert(recommended_drug_names, allergy)

        result = {
            "type": "targeted",
            "pathogen": pathogen_name,
            "risk_group": pathogen_data["risk_group"],
            "recommendations": recommendations,
            "allergy_warnings": allergy_warnings,
        }

        return make_response(200, result)

    return make_response(405, {"error": f"Method {method} not allowed"})
