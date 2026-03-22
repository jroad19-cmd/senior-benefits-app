import React, { useState } from "react";

export default function App() {
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [results, setResults] = useState([]);

  const calculate = () => {
    let res = [];
    if (income < 2000) res.push("SSI - Monthly income help");
    if (income < 2500) res.push("SNAP - Food assistance");
    if (age >= 65) res.push("Medicare Savings - Lower medical costs");
    res.push("LIHEAP - Help with utility bills");
    res.push("Unclaimed Money - Check missingmoney.com");

    setResults(res);
  };

  return (
    <div style={{padding:20}}>
      <h2>Senior Benefits Finder</h2>
      <input placeholder="Age" type="number" onChange={e=>setAge(e.target.value)} />
      <input placeholder="Monthly Income" type="number" onChange={e=>setIncome(e.target.value)} />
      <button onClick={calculate}>Find Benefits</button>

      {results.map((r,i)=><p key={i}>{r}</p>)}
    </div>
  );
}
