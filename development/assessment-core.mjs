/** Pure, side-effect-free engineering primitives. Inputs require engineering approval. */
export function testStatistics(records) {
  const valid = records.filter(r => Number.isFinite(r.score) && r.score >= 1 && r.score <= 10);
  const chronological = [...valid].sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')) || (a.odometerKm ?? 0) - (b.odometerKm ?? 0));
  const values = chronological.map(r => r.score);
  return {count: values.length, initial: values[0] ?? null, latest: values.at(-1) ?? null,
    mean: values.length ? values.reduce((a,b)=>a+b,0)/values.length : null,
    min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
    change: values.length ? values.at(-1)-values[0] : null,
    criticalFailure: records.some(r => r.criticalFailure === true),
    failure: records.some(r => r.status === 'failed' || r.criticalFailure === true)};
}

export function validateDay(day) {
  const errors=[];
  if (!Number.isFinite(day.startKm) || !Number.isFinite(day.endKm)) errors.push('Odometer values are required');
  else if (day.startKm < 0 || day.endKm < day.startKm) errors.push('Invalid odometer interval');
  const actual=errors.length ? null : day.endKm-day.startKm;
  const splits=day.routeSegments || [];
  if (splits.some(s => !s.category || !Number.isFinite(s.km) || s.km < 0)) errors.push('Invalid route allocation');
  else if (actual !== null && Math.abs(splits.reduce((sum,s)=>sum+s.km,0)-actual)>1e-7) errors.push('Route allocation must equal actual mileage');
  return {valid: errors.length === 0, errors, actualKm: actual};
}

export function mileageDashboard(targetKm, targets, days) {
  if (!Number.isFinite(targetKm) || targetKm < 0) throw new Error('Invalid target mileage');
  if (Math.abs(targets.reduce((s,t)=>s+t.percent,0)-100)>1e-7 || targets.some(t=>!t.category || !Number.isFinite(t.percent) || t.percent<0)) throw new Error('Target percentages must total 100');
  if (new Set(targets.map(t=>t.category)).size !== targets.length) throw new Error('Duplicate category');
  const actual = new Map(targets.map(t=>[t.category,0]));
  for (const day of days.filter(d=>d.confirmed === true)) {
    const check=validateDay(day); if(!check.valid) throw new Error(check.errors.join('; '));
    for(const part of day.routeSegments) { if(!actual.has(part.category)) throw new Error('Unknown route category'); actual.set(part.category,actual.get(part.category)+part.km); }
  }
  const totalActual=[...actual.values()].reduce((a,b)=>a+b,0);
  return targets.map(t=>{const target=targetKm*t.percent/100, km=actual.get(t.category); return {category:t.category,targetPercent:t.percent,targetKm:target,actualKm:km,actualPercent:totalActual ? km/totalActual*100 : null,remainingKm:Math.max(0,target-km),deviationKm:km-target}});
}

/** Capacity check only, not a route or safety-certified engineering schedule. */
export function checkMileageCapacity({targetKm, availableDays, maxDailyKm}) {
  if (![targetKm,availableDays,maxDailyKm].every(Number.isFinite) || targetKm<0 || !Number.isInteger(availableDays) || availableDays<1 || maxDailyKm<=0) throw new Error('Invalid plan inputs');
  const capacity=availableDays*maxDailyKm;
  return {feasibleByMileage:capacity>=targetKm, capacityKm:capacity, shortfallKm:Math.max(0,targetKm-capacity), requiredAverageKm:targetKm/availableDays};
}
