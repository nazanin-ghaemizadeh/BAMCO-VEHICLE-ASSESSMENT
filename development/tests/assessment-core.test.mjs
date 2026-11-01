import {test} from 'node:test';
import assert from 'node:assert/strict';
import {testStatistics,validateDay,mileageDashboard,checkMileageCapacity} from '../assessment-core.mjs';
test('repeated scores preserve extrema, trend and critical failure',()=>{
  const s=testStatistics([{date:'2026-01-01',score:9},{date:'2026-02-01',score:3,criticalFailure:true},{date:'2026-03-01',score:9}]);
  assert.equal(s.mean,7);assert.equal(s.initial,9);assert.equal(s.latest,9);assert.equal(s.min,3);assert.equal(s.failure,true);assert.equal(s.criticalFailure,true);
});
test('actual mileage validates odometer and route segments',()=>{
  assert.equal(validateDay({startKm:100,endKm:90,routeSegments:[]}).valid,false);
  assert.equal(validateDay({startKm:100,endKm:200,routeSegments:[{category:'urban',km:60},{category:'highway',km:50}]}).valid,false);
  assert.equal(validateDay({startKm:100,endKm:200,routeSegments:[{category:'urban',km:60},{category:'highway',km:40}]}).actualKm,100);
});
test('dashboard uses only confirmed days and prevents duplicate route attribution',()=>{
  const targets=[{category:'urban',percent:50},{category:'highway',percent:50}];
  const days=[{confirmed:true,startKm:100,endKm:200,routeSegments:[{category:'urban',km:60},{category:'highway',km:40}]},{confirmed:false,startKm:200,endKm:300,routeSegments:[{category:'urban',km:100}]}];
  const rows=mileageDashboard(1000,targets,days);assert.equal(rows[0].actualKm,60);assert.equal(rows[0].actualPercent,60);assert.equal(rows[1].remainingKm,460);
  assert.throws(()=>mileageDashboard(1000,targets,[{confirmed:true,startKm:0,endKm:100,routeSegments:[{category:'urban',km:110}]}]));
});
test('capacity is a necessary check and never a full plan',()=>{
  assert.equal(checkMileageCapacity({targetKm:40000,availableDays:60,maxDailyKm:600}).feasibleByMileage,false);
  assert.equal(checkMileageCapacity({targetKm:40000,availableDays:150,maxDailyKm:600}).feasibleByMileage,true);
});
