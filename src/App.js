import "./App.css";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import Papa from "papaparse";

import { Model } from "./assets/Model";

function App() {
  const [visibleFloor, setVisibleFloor] = useState("all"); // Default to ground floor
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Select All");
  const [selectedKPI, setSelectedKPI] = useState("Value"); // Default KPI
  const [kpiValue, setKpiValue] = useState(0);
  const [mode] = useState("Historical");

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/energy_data.csv");
        const text = await response.text();
        const parsedData = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        }).data;
        // Process data: extract CO2 values and month
        const dataWithMonths = parsedData.map((row) => {
          const date = new Date(row.DateTime); // Ensure the date field exists and is valid
          return {
            occupancy: parseInt(row.Occupancy),
            gas: parseInt(row.Value),
            month: date.toLocaleString("default", { month: "long" }), // Extract month name
            rowDate: row.date,
          };
        });

        const uniqueMonths = [
          "Select All",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ]; // get unique months

        setData(dataWithMonths);
        setMonths(uniqueMonths);
      } catch (error) {
        console.log("Error in fetchData", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) updateKpiValue();
  }, [data, selectedMonth, selectedKPI, mode]);

  const updateKpiValue = () => {
    let filteredData = [];
    if (mode === "Historical") {
      filteredData =
        selectedMonth === "Select All"
          ? data
          : data.filter((row) => row.month === selectedMonth);
      const totalHistorical =
        filteredData.reduce((sum, row) => {
          const value = row[selectedKPI.toLowerCase()];
          return sum + (value !== "" && !isNaN(value) ? parseFloat(value) : 0);
        }, 0);

      setKpiValue(totalHistorical || 0);
    }
  };

  return (
    <div className="App">
      <div className="floor-selector">
        <button
          className={`tile ${visibleFloor === "all" ? "active" : ""}`}
          onClick={() => setVisibleFloor("all")}
        >
          All Floors
        </button>
        <button
          className={`tile ${visibleFloor === "1st" ? "active" : ""}`}
          onClick={() => setVisibleFloor("1st")}
        >
          1st Floor
        </button>
        <button
          className={`tile ${visibleFloor === "2nd" ? "active" : ""}`}
          onClick={() => setVisibleFloor("2nd")}
        >
          2nd Floor
        </button>
      </div>
      <div className="kpi-selector">
        {["Gas"].map((kpi) => (
          <button
            key={kpi}
            className={`tile ${selectedKPI === kpi ? "active" : ""}`}
            onClick={() => setSelectedKPI(kpi)}
          >
            {kpi}
          </button>
        ))}
      </div>

      {mode === "Historical" ? (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-dropdown"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      ) : null}

      <Canvas camera={{ fov: 18 }}>
        <ambientLight intensity={1.25} />
        <Suspense fallback={null}>
          <Model
            kpi={selectedKPI}
            value={kpiValue}
            visibleFloor={visibleFloor}
          />
        </Suspense>
        <Environment preset="sunset" />
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;
