
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

const STATES = {
  "PA": {
    "portal": "https://www.compass.state.pa.us/compass.web/Public/CMPHome",
    "unclaimed": "https://www.patreasury.gov/unclaimed-property/"
  },
  "OH": {
    "portal": "https://benefits.ohio.gov/",
    "unclaimed": "https://com.ohio.gov/divisions-and-programs/unclaimed-funds"
  },
  "NY": {
    "portal": "https://mybenefits.ny.gov/mybenefits/begin",
    "unclaimed": "https://ouf.osc.state.ny.us/ouf/"
  },
  "NJ": {
    "portal": "https://www.njhelps.gov/",
    "unclaimed": "https://unclaimedfunds.nj.gov/"
  },
  "CA": {
    "portal": "https://benefitscal.com/",
    "unclaimed": "https://ucpi.sco.ca.gov/en/Property/SearchIndex"
  },
  "TX": {
    "portal": "https://www.yourtexasbenefits.com/",
    "unclaimed": "https://www.claimittexas.gov/"
  },
  "FL": {
    "portal": "https://www.myflfamilies.com/services/public-assistance",
    "unclaimed": "https://www.fltreasurehunt.gov/"
  }
};

const ALL_STATES = [
 "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
 "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
 "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const emptyForm = {
  personName: "",
  dob: "",
  age: "",
  maritalStatus: "single",
  disability: "no",
  veteran: "no",
  state: "PA",
  county: "",
  schoolDistrict: "",
  householdSize: "1",
  livesAlone: "yes",
  housing: "rent",
  primaryResidence: "yes",
  monthlyRentMortgage: "",
  propertyTaxesPaid: "",
  utilitiesSeparate: "yes",
  monthlySocialSecurity: "",
  monthlySSI: "",
  monthlySSDI: "",
  monthlyPension: "",
  monthlyWages: "",
  monthlyInterest: "",
  monthlyOtherIncome: "",
  checkingBalance: "",
  savingsBalance: "",
  otherAssets: "",
  medicareA: "no",
  medicareB: "no",
  medicareD: "no",
  medicaid: "no",
  prescriptionCosts: "",
  longTermCare: "no",
  retired: "no",
  ownsVehicle: "no"
};

function currency(n) {
  return Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function ageFromDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function totalIncome(f) {
  return ["monthlySocialSecurity","monthlySSI","monthlySSDI","monthlyPension","monthlyWages","monthlyInterest","monthlyOtherIncome"]
    .reduce((sum, key) => sum + Number(f[key] || 0), 0);
}

function totalAssets(f) {
  return Number(f.checkingBalance || 0) + Number(f.savingsBalance || 0) + Number(f.otherAssets || 0);
}

function completeness(f) {
  const keys = ["age","state","householdSize","housing","primaryResidence","monthlySocialSecurity","monthlySSI","monthlySSDI","checkingBalance","savingsBalance","disability"];
  let count = 0;
  keys.forEach(k => { if (String(f[k] ?? "").trim() !== "") count += 1; });
  return count / keys.length;
}

function scoreLabel(score, fill) {
  if (fill >= 0.9 && score >= 95) return "Definitely worth applying";
  if (score >= 80) return "Strong match";
  if (score >= 55) return "Possible";
  return "Needs more information";
}

function add(items, name, type, category, description, docs, link, score) {
  items.push({ name, type, category, description, docs, link, score });
}

function buildResults(f) {
  const age = Number(f.age || 0);
  const income = totalIncome(f);
  const assets = totalAssets(f);
  const household = Math.max(1, Number(f.householdSize || 1));
  const fill = completeness(f);
  const items = [];

  let ssiScore = 0;
  if (age >= 65 || f.disability === "yes") ssiScore += 35;
  if (income <= 1971) ssiScore += 40;
  if ((f.maritalStatus === "married" && assets <= 3000) || (f.maritalStatus !== "married" && assets <= 2000)) ssiScore += 20;
  ssiScore += 5;
  add(items, "SSI", "Federal", "Cash / income", "Monthly cash assistance for older adults and people with disabilities who meet income and resource rules.", "Photo ID, Social Security number, income proof, bank balances, housing costs.", "https://www.ssa.gov/ssi", ssiScore);

  let ssdiScore = 0;
  if (f.disability === "yes") ssdiScore += 45;
  if (Number(f.monthlySSDI || 0) > 0) ssdiScore += 40;
  if (age < 65) ssdiScore += 10;
  if (Number(f.monthlyWages || 0) < 1700) ssdiScore += 5;
  if (ssdiScore > 0) add(items, "SSDI", "Federal", "Cash / income", "Disability income for people with qualifying work history and disability status.", "Work history, medical records, diagnosis details, provider information, income information.", "https://www.ssa.gov/benefits/disability/", ssdiScore);

  let snapScore = 0;
  const snapLimit = 2550 + (household - 1) * 900;
  if (income <= snapLimit) snapScore += 70;
  if (f.housing === "rent" || Number(f.monthlyRentMortgage || 0) > 0) snapScore += 15;
  if (f.utilitiesSeparate === "yes") snapScore += 10;
  snapScore += 5;
  add(items, "SNAP", "Federal", "Food", "Monthly grocery help based on income and household size.", "ID, income proof, rent or mortgage, utility bills, household members.", "https://www.fns.usda.gov/snap", snapScore);

  let liheapScore = 0;
  if (income <= 3000) liheapScore += 60;
  if (Number(f.monthlyRentMortgage || 0) > 0 || Number(f.propertyTaxesPaid || 0) > 0) liheapScore += 15;
  if (f.utilitiesSeparate === "yes") liheapScore += 20;
  liheapScore += 5;
  add(items, "LIHEAP", "Federal / State", "Utilities", "Help with heating and cooling bills.", "Utility bill, ID, income proof, household list.", "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap", liheapScore);

  if (f.housing === "rent") {
    let sec8 = 0;
    if (income <= 3000) sec8 += 40;
    if (Number(f.monthlyRentMortgage || 0) > 0) sec8 += 15;
    if (f.disability === "yes" || age >= 62) sec8 += 10;
    sec8 += 35;
    add(items, "Housing Choice Voucher / Section 8", "Federal / Local", "Housing", "Rent assistance through local housing authorities.", "ID, income proof, rent amount, lease, household information.", "https://www.hud.gov/topics/housing_choice_voucher_program_section_8", sec8);
  }

  if (age >= 65 || f.disability === "yes" || f.medicareA === "yes" || f.medicareB === "yes") {
    let msp = 0;
    if (f.medicareA === "yes" || f.medicareB === "yes") msp += 30;
    if (income <= 2200) msp += 40;
    if (assets <= 10000) msp += 20;
    if (age >= 65 || f.disability === "yes") msp += 10;
    add(items, "Medicare Savings Programs", "Federal / State", "Medical / prescription savings", "Help paying Medicare premiums and sometimes deductibles or copays.", "Medicare card, ID, income proof, bank balances.", "https://www.medicare.gov/basics/costs/help/medicare-savings-programs", msp);

    let extraHelp = 0;
    if (f.medicareD === "yes" || f.medicareA === "yes" || f.medicareB === "yes") extraHelp += 25;
    if (income <= 2500) extraHelp += 40;
    if (assets <= 18000) extraHelp += 20;
    if (Number(f.prescriptionCosts || 0) > 0) extraHelp += 15;
    add(items, "Extra Help for Prescriptions", "Federal", "Medical / prescription savings", "Help paying Medicare Part D prescription costs.", "Medicare information, prescription list, income and resource details.", "https://www.ssa.gov/extrahelp", extraHelp);
  }

  if (f.disability === "yes") {
    let medicaidDis = 0;
    medicaidDis += 40;
    if (income <= 2200) medicaidDis += 30;
    if (assets <= 10000) medicaidDis += 20;
    if (f.longTermCare === "yes") medicaidDis += 10;
    add(items, "Medicaid (Disability Path)", "Federal / State", "Medical / disability support", "Medical coverage pathway commonly used by younger people with disabilities and adults with care needs.", "ID, medical records, income proof, bank balances, disability information.", STATES[f.state]?.portal || "https://www.medicaid.gov/", medicaidDis);

    let hcbs = 0;
    hcbs += 40;
    if (f.longTermCare === "yes") hcbs += 25;
    if (f.medicaid === "yes") hcbs += 20;
    if (Number(f.prescriptionCosts || 0) > 0) hcbs += 15;
    add(items, "HCBS Waivers / Home Care Support", "State", "Medical / disability support", "Home and community-based services that may help with care at home instead of institutional care.", "Medical records, care needs, Medicaid details, physician information.", STATES[f.state]?.portal || "https://www.medicaid.gov/medicaid/home-community-based-services/home-community-based-services-authorities/index.html", hcbs);

    add(items, "ABLE Account", "Federal / State", "Financial planning", "Tax-advantaged savings account for eligible people with disabilities.", "Disability onset information, identification, banking information.", "https://www.ablenrc.org/", 85);
    add(items, "Ticket to Work", "Federal", "Work support", "Employment support for people receiving disability benefits.", "SSDI or SSI benefit information, work goals.", "https://choosework.ssa.gov/", 75);
  }

  const statePortal = STATES[f.state]?.portal || "https://www.benefits.gov/benefit-finder";
  const stateUnclaimed = STATES[f.state]?.unclaimed || "https://www.missingmoney.com/";
  add(items, `${f.state} State Benefits Portal`, "State", "General state help", "Official state portal for food, medical, cash, utility, and other support programs.", "ID, address, income proof, household size.", statePortal, 100);
  add(items, `${f.state} Unclaimed Money`, "State", "Unclaimed money", "Search for unclaimed money, dormant accounts, old refunds, or property owed to you.", "Your name and current or past address.", stateUnclaimed, 100);

  if (f.state === "PA") {
    let ptrr = 0;
    if (age >= 65 || f.disability === "yes") ptrr += 25;
    if (f.primaryResidence === "yes") ptrr += 15;
    if (income * 12 <= 35000) ptrr += 35;
    if (f.housing === "rent" || Number(f.propertyTaxesPaid || 0) > 0) ptrr += 15;
    add(items, "PA Property Tax / Rent Rebate", "Pennsylvania", "Cash / tax relief", "Annual rebate for eligible older adults and some people with disabilities.", "Rent certificate or property tax proof, income documents, ID.", "https://www.revenue.pa.gov/IncentivesCreditsPrograms/PropertyTaxRentRebateProgram/Pages/default.aspx", ptrr);

    let homestead = 0;
    if (f.primaryResidence === "yes") homestead += 40;
    if (f.housing === "own") homestead += 25;
    if (f.schoolDistrict) homestead += 15;
    if (Number(f.propertyTaxesPaid || 0) > 0) homestead += 20;
    add(items, "PA Homestead / Farmstead Exclusion", "Pennsylvania", "Cash / tax relief", "Property tax relief that may reduce the assessed value used to calculate school property taxes on an eligible primary residence. This is different from the cash rebate program.", "Proof the home is your primary residence, parcel or property information, homeowner information, county assessment application.", "https://dced.pa.gov/local-government/property-tax-relief-homestead-exclusion/", homestead);

    let pace = 0;
    if (age >= 65) pace += 25;
    if (income * 12 <= 33000) pace += 35;
    if (f.medicareD === "yes" || Number(f.prescriptionCosts || 0) > 0) pace += 20;
    pace += 20;
    add(items, "PACE / PACENET", "Pennsylvania", "Medical / prescription savings", "Prescription help for eligible Pennsylvania seniors.", "Prescription list, Medicare card, income proof, ID.", "https://www.aging.pa.gov/aging-services/prescription-assistance/Pages/default.aspx", pace);

    let vehicle = 0;
    if (f.retired === "yes") vehicle += 35;
    if (f.ownsVehicle === "yes") vehicle += 35;
    if (income * 12 <= 29000) vehicle += 20;
    if (age >= 65) vehicle += 10;
    add(items, "PA Retired Person Vehicle Registration", "Pennsylvania", "Transportation savings", "Reduced retired-status vehicle registration fee for eligible retired Pennsylvanians.", "Vehicle registration, proof of retirement or retired status, income information, PennDOT form.", "https://www.pa.gov/services/dmv/apply-for-retired-status-vehicle-registration", vehicle);

    add(items, "PA MEDI", "Pennsylvania", "Medical / prescription savings", "Free Medicare counseling that can help compare plans, avoid penalties, and reduce out-of-pocket costs.", "Medicare card, current plan information, medication list.", "https://www.pa.gov/agencies/aging/aging-programs-and-services/pa-medi-medicare-counseling", 100);

    let optionsScore = 0;
    if (age >= 60) optionsScore += 35;
    if (f.longTermCare === "yes") optionsScore += 35;
    if (f.housing !== "rent") optionsScore += 10;
    if (income <= 4000) optionsScore += 20;
    add(items, "PA OPTIONS Program", "Pennsylvania", "Care at home", "Supports for eligible older adults who need help with daily living and want to remain at home.", "Care needs, income information, ID, contact information.", "https://www.pa.gov/services/aging/apply-for-options-program", optionsScore);

    let chcScore = 0;
    if (f.medicaid === "yes" && (f.medicareA === "yes" || f.medicareB === "yes")) chcScore += 50;
    if (f.disability === "yes" && age >= 21) chcScore += 30;
    if (f.longTermCare === "yes") chcScore += 20;
    add(items, "PA Community HealthChoices (CHC)", "Pennsylvania", "Care at home / disability support", "Managed long-term services and supports for dual-eligible adults and adults with physical disabilities.", "Medicaid and Medicare information, care needs, medical records.", "https://www.pa.gov/agencies/dhs/resources/medicaid/chc/chc-providers", chcScore);

    let olderDisabledMedicaid = 0;
    if (f.disability === "yes" || age >= 65) olderDisabledMedicaid += 40;
    if (income <= 2200) olderDisabledMedicaid += 35;
    if (assets <= 10000) olderDisabledMedicaid += 25;
    add(items, "PA Medicaid for Older Adults and People with Disabilities", "Pennsylvania", "Medical / disability support", "Pennsylvania Medicaid category for older adults and people with disabilities.", "Income proof, bank balances, ID, medical or disability information.", "https://www.pa.gov/agencies/dhs/resources/aging-physical-disabilities/medicaid-older-people-and-people-with-disabilities", olderDisabledMedicaid);

    let share = 0;
    if (age >= 60) share += 35;
    if (f.housing === "rent" || f.housing === "own") share += 20;
    if (income <= 3500) share += 20;
    if (f.county) share += 25;
    add(items, "PA SHARE Program", "Pennsylvania", "Housing", "Shared housing and resource exchange option for eligible older adults in participating counties.", "County, housing situation, contact information, basic income details.", "https://www.pa.gov/services/aging/apply-to-the-shared-housing-and-resource-exchange--share--progra", share);

    let domCare = 0;
    if (age >= 18) domCare += 15;
    if (f.longTermCare === "yes") domCare += 40;
    if (f.housing === "live_with_family" || f.housing === "rent") domCare += 15;
    if (income <= 3500) domCare += 15;
    if (f.disability === "yes" || age >= 60) domCare += 15;
    add(items, "PA Domiciliary Care", "Pennsylvania", "Housing / supportive living", "Family-like home setting for adults who need supervision and support and cannot live alone.", "Functional needs, contact information, income details, care assessment.", "https://www.pa.gov/agencies/aging/aging-programs-and-services/housing-programs-for-older-adults", domCare);

    if (f.disability === "yes") {
      add(items, "PA OBRA Waiver", "Pennsylvania Disability", "Medical / disability support", "Home and community services for adults with developmental physical disabilities.", "Medical records, care needs, financial details, waiver intake forms.", "https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-waivers.html", 88);
      add(items, "PA COMMCARE Waiver", "Pennsylvania Disability", "Medical / disability support", "Services for adults with traumatic brain injury and related care needs.", "Medical records, physician information, functional needs, Medicaid details.", "https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-waivers.html", 84);
      add(items, "PA Attendant Care / Independence Waivers", "Pennsylvania Disability", "Medical / disability support", "In-home support programs for eligible adults with disabilities.", "Medical records, level-of-care details, Medicaid information, functional assessment.", "https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-waivers.html", 86);
    }
  }

  return items.map(item => {
    const label = item.score === 100 && (item.name.includes("Portal") || item.name.includes("Unclaimed") || item.name === "PA MEDI")
      ? "Definitely worth checking"
      : scoreLabel(item.score, fill);
    return { ...item, label };
  }).sort((a, b) => b.score - a.score || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [results, setResults] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("benefits-profiles") || "[]");
      if (Array.isArray(saved)) setProfiles(saved);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (form.dob) {
      const nextAge = ageFromDob(form.dob);
      if (nextAge && nextAge !== form.age) setForm(prev => ({ ...prev, age: nextAge }));
    }
  }, [form.dob]);

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function calculate() {
    const next = buildResults(form);
    setResults(next);
    setPage(3);
    speakText(`Found ${next.length} programs.`);
  }

  function saveProfile() {
    const name = form.personName?.trim() || `Profile ${profiles.length + 1}`;
    const next = [...profiles.filter(p => p.personName !== name), { ...form, personName: name }];
    setProfiles(next);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
    speakText(`Saved profile for ${name}`);
  }

  function loadProfile(p) {
    setForm(p);
    setResults(buildResults(p));
    setPage(3);
  }

  function removeProfile(name) {
    const next = profiles.filter(p => p.personName !== name);
    setProfiles(next);
    localStorage.setItem("benefits-profiles", JSON.stringify(next));
  }

  const monthlyIncome = useMemo(() => totalIncome(form), [form]);
  const assets = useMemo(() => totalAssets(form), [form]);
  const fill = Math.round(completeness(form) * 100);

  return (
    <div className="shell">
      <div className="wrap">
        <div className="hero">
          <div>
            <h1>Benefits Finder Pro</h1>
            <p>Senior, caregiver, and disability screening with stronger Pennsylvania coverage and result categories.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={page===1?"active":""} onClick={() => setPage(1)}>Basic Info</button>
          <button className={page===2?"active":""} onClick={() => setPage(2)}>Eligibility Details</button>
          <button className={page===3?"active":""} onClick={() => setPage(3)}>Results</button>
        </div>

        {page === 1 && (
          <div className="card">
            <h2>Basic Information</h2>

            <label>Name</label>
            <input value={form.personName} onChange={e => updateField("personName", e.target.value)} placeholder="Example: Mary Smith" />

            <div className="row">
              <div>
                <label>Date of birth</label>
                <input type="date" value={form.dob} onChange={e => updateField("dob", e.target.value)} />
              </div>
              <div>
                <label>Age</label>
                <input type="number" value={form.age} onChange={e => updateField("age", e.target.value)} placeholder="65" />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Marital status</label>
                <select value={form.maritalStatus} onChange={e => updateField("maritalStatus", e.target.value)}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label>Disability</label>
                <select value={form.disability} onChange={e => updateField("disability", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Retired</label>
                <select value={form.retired} onChange={e => updateField("retired", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label>Owns a vehicle</label>
                <select value={form.ownsVehicle} onChange={e => updateField("ownsVehicle", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Veteran</label>
                <select value={form.veteran} onChange={e => updateField("veteran", e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label>State</label>
                <select value={form.state} onChange={e => updateField("state", e.target.value)}>
                  {ALL_STATES.map(abbr => <option key={abbr} value={abbr}>{abbr}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>County</label>
                <input value={form.county} onChange={e => updateField("county", e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label>School district</label>
                <input value={form.schoolDistrict} onChange={e => updateField("schoolDistrict", e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="actions">
              <button onClick={() => setPage(2)}>Next</button>
              <button className="secondary" onClick={saveProfile}>Save profile</button>
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="card">
            <h2>Eligibility Details</h2>

            <div className="row">
              <div>
                <label>Household size</label>
                <input type="number" value={form.householdSize} onChange={e => updateField("householdSize", e.target.value)} />
              </div>
              <div>
                <label>Housing</label>
                <select value={form.housing} onChange={e => updateField("housing", e.target.value)}>
                  <option value="rent">Rent</option>
                  <option value="own">Own</option>
                  <option value="live_with_family">Live with family</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div><label>Primary residence</label><select value={form.primaryResidence} onChange={e => updateField("primaryResidence", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
              <div><label>Utilities separate</label><select value={form.utilitiesSeparate} onChange={e => updateField("utilitiesSeparate", e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
            </div>

            <label>Monthly income by source</label>
            <div className="grid3">
              <input type="number" value={form.monthlySocialSecurity} onChange={e => updateField("monthlySocialSecurity", e.target.value)} placeholder="Social Security" />
              <input type="number" value={form.monthlySSI} onChange={e => updateField("monthlySSI", e.target.value)} placeholder="SSI" />
              <input type="number" value={form.monthlySSDI} onChange={e => updateField("monthlySSDI", e.target.value)} placeholder="SSDI" />
              <input type="number" value={form.monthlyPension} onChange={e => updateField("monthlyPension", e.target.value)} placeholder="Pension" />
              <input type="number" value={form.monthlyWages} onChange={e => updateField("monthlyWages", e.target.value)} placeholder="Wages" />
              <input type="number" value={form.monthlyInterest} onChange={e => updateField("monthlyInterest", e.target.value)} placeholder="Interest / Other" />
            </div>

            <label>Assets</label>
            <div className="grid3">
              <input type="number" value={form.checkingBalance} onChange={e => updateField("checkingBalance", e.target.value)} placeholder="Checking" />
              <input type="number" value={form.savingsBalance} onChange={e => updateField("savingsBalance", e.target.value)} placeholder="Savings" />
              <input type="number" value={form.otherAssets} onChange={e => updateField("otherAssets", e.target.value)} placeholder="Other assets" />
            </div>

            <div className="row">
              <div><label>Monthly rent / mortgage</label><input type="number" value={form.monthlyRentMortgage} onChange={e => updateField("monthlyRentMortgage", e.target.value)} /></div>
              <div><label>Property taxes paid yearly</label><input type="number" value={form.propertyTaxesPaid} onChange={e => updateField("propertyTaxesPaid", e.target.value)} /></div>
            </div>

            <div className="row">
              <div><label>Medicare A</label><select value={form.medicareA} onChange={e => updateField("medicareA", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div><label>Medicare B</label><select value={form.medicareB} onChange={e => updateField("medicareB", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>

            <div className="row">
              <div><label>Medicare D</label><select value={form.medicareD} onChange={e => updateField("medicareD", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div><label>Medicaid active</label><select value={form.medicaid} onChange={e => updateField("medicaid", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>

            <div className="row">
              <div><label>Prescription costs per month</label><input type="number" value={form.prescriptionCosts} onChange={e => updateField("prescriptionCosts", e.target.value)} /></div>
              <div><label>Long-term care / home care need</label><select value={form.longTermCare} onChange={e => updateField("longTermCare", e.target.value)}><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>

            <div className="summary">
              <div><strong>Total monthly income:</strong> {currency(monthlyIncome)}</div>
              <div><strong>Total assets:</strong> {currency(assets)}</div>
              <div><strong>Info entered:</strong> {fill}%</div>
            </div>

            <div className="actions">
              <button className="secondary" onClick={() => setPage(1)}>Back</button>
              <button onClick={calculate}>Find benefits</button>
              <button className="secondary" onClick={saveProfile}>Save profile</button>
            </div>
          </div>
        )}

        {page === 3 && (
          <div className="card">
            <h2>Results</h2>
            <div className="notice">Pennsylvania results now include tax relief, transportation savings, care-at-home options, housing support, and disability services.</div>

            <div className="actions">
              <button className="secondary" onClick={() => setPage(1)}>Edit info</button>
              <button className="secondary" onClick={() => window.print()}>Print</button>
              <button className="secondary" onClick={() => speakText(`There are ${results.length} results.`)}>Read aloud</button>
            </div>

            {results.length === 0 ? <div className="empty">Enter information and tap Find benefits.</div> : results.map((item, i) => (
              <div key={i} className="result">
                <div className="resultTop">
                  <h3>{item.name}</h3>
                  <span className={`badge ${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                </div>
                <div className="muted">{item.type} · {item.category}</div>
                <p>{item.description}</p>
                <p><strong>Match score:</strong> {item.score}/100</p>
                <p><strong>What to gather:</strong> {item.docs}</p>
                <a href={item.link} target="_blank" rel="noreferrer">Open official site</a>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Saved profiles</h2>
          {profiles.length === 0 ? <div className="empty">No saved profiles yet.</div> : profiles.map((p, i) => (
            <div key={i} className="saved">
              <div>
                <strong>{p.personName || `Profile ${i+1}`}</strong>
                <div className="muted">{p.state} · Age {p.age || "—"} · Income {currency([
                  p.monthlySocialSecurity,p.monthlySSI,p.monthlySSDI,p.monthlyPension,p.monthlyWages,p.monthlyInterest,p.monthlyOtherIncome
                ].reduce((a,b)=>a+Number(b||0),0))}</div>
              </div>
              <div className="miniActions">
                <button className="secondary" onClick={() => loadProfile(p)}>Load</button>
                <button className="danger" onClick={() => removeProfile(p.personName)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
