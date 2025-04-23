import { useState } from 'react';

export default function FairRotationSystem() {
  const [numPeople, setNumPeople] = useState(6);
  const [draftStarted, setDraftStarted] = useState(false);
  const [currentPick, setCurrentPick] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [extraWeeksDistribution, setExtraWeeksDistribution] = useState("random");
  
  const totalWeeks = 52;
  const quartersPerYear = 4;
  const weeksPerQuarter = 13;
  const regularWeeksPerQuarter = 12; // Remove 13th week for maintenance
  const maintenanceWeeks = [13, 26, 39, 52]; // 13th week of each quarter
  
  // Calculate available weeks for rotation (excluding maintenance weeks)
  const availableWeeks = totalWeeks - maintenanceWeeks.length;
  const weeksPerPerson = Math.floor(availableWeeks / numPeople);
  const extraWeeks = availableWeeks % numPeople;
  
  // Generate people array
  const people = Array.from({ length: numPeople }, (_, i) => `Person ${i + 1}`);
  
  // Check if a week is a maintenance week
  const isMaintenanceWeek = (week) => maintenanceWeeks.includes(week);
  
  // Calculate draft order using snake draft pattern with quarterly rotation
  const calculateDraftOrder = () => {
    const order = [];
    let globalPickNumber = 1;
    
    // Process each quarter separately
    for (let quarter = 0; quarter < quartersPerYear; quarter++) {
      const quarterStartWeek = quarter * weeksPerQuarter + 1;
      const quarterEndWeek = (quarter + 1) * weeksPerQuarter;
      
      // Calculate how many rounds in this quarter (excluding maintenance week)
      const quarterRounds = Math.ceil(regularWeeksPerQuarter / numPeople);
      
      // Calculate the rotation offset for this quarter
      const rotationOffset = quarter % numPeople;
      
      for (let round = 0; round < quarterRounds; round++) {
        for (let i = 0; i < numPeople; i++) {
          // Calculate week number within this quarter
          let weekOffset = (round * numPeople) + i;
          
          // Skip if we've already assigned all regular weeks in this quarter
          if (weekOffset >= regularWeeksPerQuarter) continue;
          
          // Calculate actual week number (1-52)
          let weekNumber = quarterStartWeek + weekOffset;
          
          // Skip maintenance weeks
          if (isMaintenanceWeek(weekNumber)) continue;
          
          // Apply rotation offset to determine who picks first this quarter
          let personIndex = (i + rotationOffset) % numPeople;
          
          // Reverse order for even rounds (snake draft)
          if (round % 2 === 1) {
            personIndex = numPeople - 1 - i;
            // Apply rotation offset for even rounds
            personIndex = (personIndex + rotationOffset) % numPeople;
          }
          
          // Calculate the overall round number (across quarters)
          const globalRound = Math.floor(globalPickNumber / numPeople) + 1;
          
          order.push({
            round: globalRound,
            person: personIndex,
            pick: weekNumber,
            quarter: quarter + 1,
            globalPickNumber: globalPickNumber++
          });
        }
      }
    }
    
    return order;
  };
  
  const draftOrder = calculateDraftOrder();
  
  // Create a mapping of weeks by person
  const getWeeksByPerson = () => {
    const weeksByPerson = Array(numPeople).fill().map(() => []);
    
    assignments.forEach(assignment => {
      const personIndex = assignment.person;
      weeksByPerson[personIndex].push(assignment.pick);
    });
    
    return weeksByPerson;
  };
  
  // Simulate draft
  const startDraft = () => {
    setDraftStarted(true);
    setCurrentPick(0);
    setAssignments([]);
  };
  
  const makeNextPick = () => {
    if (currentPick < draftOrder.length) {
      setAssignments([...assignments, draftOrder[currentPick]]);
      setCurrentPick(currentPick + 1);
    }
  };
  
  const resetDraft = () => {
    setDraftStarted(false);
    setCurrentPick(0);
    setAssignments([]);
  };
  
  // Distribute extra weeks
  const distributeExtraWeeks = () => {
    const distribution = Array(numPeople).fill(weeksPerPerson);
    
    if (extraWeeksDistribution === "random") {
      // Randomly distribute extra weeks
      let remainingExtra = extraWeeks;
      const candidates = [...Array(numPeople).keys()];
      
      while (remainingExtra > 0 && candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedPerson = candidates[randomIndex];
        distribution[selectedPerson]++;
        remainingExtra--;
        
        // Remove the person from candidates to avoid giving them another extra week
        // until everyone has gotten one
        if (remainingExtra > 0 && candidates.length > remainingExtra) {
          candidates.splice(randomIndex, 1);
        }
      }
    } else if (extraWeeksDistribution === "priority") {
      // Give priority to people with later picks in round 1
      for (let i = 0; i < extraWeeks; i++) {
        distribution[numPeople - 1 - (i % numPeople)]++;
      }
    }
    
    return distribution;
  };
  
  const weekDistribution = distributeExtraWeeks();
  
  // Create schedule overview visualization
  const weeksByPerson = getWeeksByPerson();
  
  // Group assignments by quarter for visualization
  const getAssignmentsByQuarter = () => {
    const result = [];
    for (let q = 0; q < quartersPerYear; q++) {
      result.push([]);
    }
    
    assignments.forEach(assignment => {
      const quarterIndex = assignment.quarter - 1;
      result[quarterIndex].push(assignment);
    });
    
    return result;
  };
  
  const assignmentsByQuarter = getAssignmentsByQuarter();
  
  // Create quarterly pick order visualization
  const createQuarterlyPickOrderVisualization = () => {
    const quarterlyFirstPickers = [];
    
    for (let quarter = 0; quarter < quartersPerYear; quarter++) {
      // Calculate rotation for this quarter
      const rotationOffset = quarter % numPeople;
      
      // Create the rotated order of people for the first pick of this quarter
      const rotatedPeople = [...people.slice(rotationOffset), ...people.slice(0, rotationOffset)];
      
      quarterlyFirstPickers.push({
        quarter: quarter + 1,
        firstPicker: `Person ${rotationOffset + 1}`,
        order: rotatedPeople.join(' → '),
        maintenanceWeek: (quarter + 1) * weeksPerQuarter
      });
    }
    
    return quarterlyFirstPickers;
  };
  
  const quarterlyPickOrder = createQuarterlyPickOrderVisualization();
  
  // Calculate maintenance week dates (for display purposes)
  const getMaintenanceWeekRanges = () => {
    return maintenanceWeeks.map((week, idx) => {
      return {
        quarter: idx + 1,
        week: week,
        description: `Week ${week} (Q${idx + 1} maintenance)`
      };
    });
  };
  
  const maintenanceWeekRanges = getMaintenanceWeekRanges();
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Interactive Fair Rotation System with Quarterly Maintenance</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step 1: Calculate Regular Weeks</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>Total weeks:</strong> {totalWeeks} weeks per year</p>
          <p><strong>Maintenance weeks:</strong> 4 weeks (Week 13, 26, 39, 52)</p>
          <p><strong>Available weeks for rotation:</strong> {availableWeeks} weeks</p>
          <p><strong>Formula:</strong> {availableWeeks} weeks ÷ {numPeople} people = {weeksPerPerson} weeks each, with {extraWeeks} weeks left over.</p>
          
          <div className="mt-2">
            <label className="block mb-1">Number of people:</label>
            <input 
              type="range" 
              min="2" 
              max="12" 
              value={numPeople} 
              onChange={(e) => {
                setNumPeople(parseInt(e.target.value));
                resetDraft();
              }}
              className="w-full mb-2"
            />
            <div className="text-center">{numPeople}</div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step 2: Maintenance Week Schedule</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-2">The 13th week of each quarter is reserved for maintenance:</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">Quarter</th>
                  <th className="border border-gray-300 p-2">Week Number</th>
                  <th className="border border-gray-300 p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceWeekRanges.map((maintenance, idx) => (
                  <tr key={idx} className="bg-yellow-50">
                    <td className="border border-gray-300 p-2 text-center">Q{maintenance.quarter}</td>
                    <td className="border border-gray-300 p-2 text-center">{maintenance.week}</td>
                    <td className="border border-gray-300 p-2">{maintenance.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step 3: Create a Quarterly Rotating Draft System</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-2">Using a <strong>quarterly rotating snake draft</strong> system:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Each quarter has 12 regular weeks for assignment (excluding maintenance week)</li>
            <li>The pick order rotates at the start of each quarter</li>
            <li>Within each quarter, a snake draft pattern is used</li>
          </ul>
          
          <h3 className="font-semibold mb-2">Quarterly Pick Order Rotation</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">Quarter</th>
                  <th className="border border-gray-300 p-2">Regular Weeks</th>
                  <th className="border border-gray-300 p-2">First Picker</th>
                  <th className="border border-gray-300 p-2">Pick Order</th>
                  <th className="border border-gray-300 p-2">Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyPickOrder.map((quarter, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 text-center">Q{quarter.quarter}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {idx * weeksPerQuarter + 1} - {(idx + 1) * weeksPerQuarter - 1}
                      {" "}(excluding week {quarter.maintenanceWeek})
                    </td>
                    <td className="border border-gray-300 p-2 text-center">{quarter.firstPicker}</td>
                    <td className="border border-gray-300 p-2">{quarter.order}</td>
                    <td className="border border-gray-300 p-2 text-center bg-yellow-50">Week {quarter.maintenanceWeek}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <h3 className="font-semibold mb-2">Snake Draft Pattern Example (Q1)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">Round</th>
                  {people.map((person, idx) => (
                    <th key={idx} className="border border-gray-300 p-2">{person}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(Math.min(2, Math.ceil(regularWeeksPerQuarter / numPeople)))].map((_, roundIdx) => {
                  // Each visualization round shows 2 actual draft rounds (forward and backward)
                  return (
                    <tr key={roundIdx}>
                      <td className="border border-gray-300 p-2 text-center">{roundIdx * 2 + 1}-{roundIdx * 2 + 2}</td>
                      
                      {people.map((_, personIdx) => {
                        const forwardPick = roundIdx * 2 * numPeople + personIdx + 1;
                        const backwardPick = (roundIdx * 2 + 1) * numPeople - personIdx;
                        
                        return (
                          <td key={personIdx} className="border border-gray-300 p-2 text-center">
                            {forwardPick <= regularWeeksPerQuarter ? forwardPick : null}
                            <br />
                            {backwardPick <= regularWeeksPerQuarter ? backwardPick : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step 4: Add the Extra Weeks</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-2"><strong>Current situation:</strong></p>
          <ul className="list-disc pl-6 mb-4">
            <li>{numPeople} people × {weeksPerPerson} weeks = {numPeople * weeksPerPerson} weeks</li>
            <li>{extraWeeks} extra weeks remain</li>
          </ul>
          
          <div className="mb-4">
            <p className="mb-2"><strong>How would you like to distribute the extra weeks?</strong></p>
            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="random" 
                  checked={extraWeeksDistribution === "random"} 
                  onChange={() => setExtraWeeksDistribution("random")}
                  className="mr-2"
                />
                Assign extra weeks randomly
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="priority" 
                  checked={extraWeeksDistribution === "priority"} 
                  onChange={() => setExtraWeeksDistribution("priority")}
                  className="mr-2"
                />
                Give priority to people with later picks in Q1
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Distribution Plan:</h3>
            <p className="mb-2">{extraWeeksDistribution === "random" ? "Randomly assign" : "Prioritize"} {extraWeeks} extra weeks among {numPeople} people.</p>
            <ul className="list-disc pl-6">
              {weekDistribution.map((weeks, idx) => (
                <li key={idx}>Person {idx + 1}: {weeks} weeks</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Step 5: Draft Simulation</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="mb-4">
            <button 
              onClick={draftStarted ? makeNextPick : startDraft}
              disabled={draftStarted && currentPick >= draftOrder.length}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
            >
              {!draftStarted ? "Start Draft Simulation" : 
                currentPick >= draftOrder.length ? "Draft Complete" : "Make Next Pick"}
            </button>
            <button 
              onClick={resetDraft}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Reset Simulation
            </button>
          </div>
          
          {draftStarted && assignments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Current Draft Status</h3>
              {assignmentsByQuarter.map((quarterAssignments, quarterIdx) => {
                if (quarterAssignments.length === 0) return null;
                
                return (
                  <div key={quarterIdx} className="mb-6">
                    <h4 className="font-medium mb-2">Quarter {quarterIdx + 1} (Weeks {quarterIdx * weeksPerQuarter + 1}-{(quarterIdx + 1) * weeksPerQuarter})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-300 p-2">Round</th>
                            <th className="border border-gray-300 p-2">Pick #</th>
                            <th className="border border-gray-300 p-2">Person</th>
                            <th className="border border-gray-300 p-2">Week</th>
                            <th className="border border-gray-300 p-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Add maintenance week row */}
                          <tr className="bg-yellow-50">
                            <td className="border border-gray-300 p-2 text-center" colSpan="3">MAINTENANCE</td>
                            <td className="border border-gray-300 p-2 text-center">{(quarterIdx + 1) * weeksPerQuarter}</td>
                            <td className="border border-gray-300 p-2">Not assigned to any person</td>
                          </tr>
                          
                          {/* Regular assignments */}
                          {quarterAssignments.map((assignment, idx) => (
                            <tr key={idx} className="hover:bg-blue-50">
                              <td className="border border-gray-300 p-2 text-center">{assignment.round}</td>
                              <td className="border border-gray-300 p-2 text-center">{assignment.globalPickNumber}</td>
                              <td className="border border-gray-300 p-2">Person {assignment.person + 1}</td>
                              <td className="border border-gray-300 p-2 text-center">{assignment.pick}</td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {!draftStarted && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 p-2" colSpan={numPeople + 1}>Draft Preview</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={numPeople + 1} className="border border-gray-300 p-2 text-center">
                      Draft not started. Click "Start Draft Simulation" to begin.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {draftStarted && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Assignment Summary:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {weeksByPerson.map((weeks, personIdx) => (
                  <div key={personIdx} className="bg-white p-3 rounded shadow">
                    <h4 className="font-medium mb-1">Person {personIdx + 1}</h4>
                    <p>Weeks: {weeks.sort((a, b) => a - b).join(', ')}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {weeks.length} / {weekDistribution[personIdx]} assigned
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">System Overview</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p>With {numPeople} people rotating quarterly and 4 maintenance weeks, each person gets {weeksPerPerson} regular weeks. The {extraWeeks} extra weeks are {extraWeeksDistribution === "random" ? "randomly distributed" : "distributed with priority to later first-round picks"}.</p>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">System Highlights:</h3>
            <ul className="list-disc pl-6">
              <li>4 dedicated maintenance weeks (week 13, 26, 39, 52)</li>
              <li>Quarterly rotation ensures fair distribution of seasonal weeks</li>
              <li>12 assignable weeks per quarter (instead of 13)</li>
              <li>Total of {availableWeeks} assignable weeks per year</li>
              <li>Snake draft pattern within each quarter maintains fairness</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
