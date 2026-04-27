export const TEAM_COLORS = {
  mclaren: '#FF8000', red_bull: '#b8941c', ferrari: '#e80020',
  mercedes: '#27f4d2', aston_martin: '#229971', alpine: '#ff87bc',
  williams: '#64c4ff', haas: '#b6babd', rb: '#6692ff',
  audi: '#bb0000', cadillac: '#e0e0e0',
};

export const DRIVERS = [
  { id: 'norris',     name: 'Lando Norris',      family: 'NORRIS',     team: 'mclaren',      pts: 187, wins: 4, form: [1,3,1,3,1] },
  { id: 'verstappen', name: 'Max Verstappen',     family: 'VERSTAPPEN', team: 'red_bull',     pts: 174, wins: 3, form: [2,1,2,1,4] },
  { id: 'piastri',    name: 'Oscar Piastri',      family: 'PIASTRI',    team: 'mclaren',      pts: 152, wins: 2, form: [3,2,3,2,2] },
  { id: 'leclerc',    name: 'Charles Leclerc',    family: 'LECLERC',    team: 'ferrari',      pts: 138, wins: 2, form: [4,4,1,5,3] },
  { id: 'russell',    name: 'George Russell',     family: 'RUSSELL',    team: 'mercedes',     pts: 112, wins: 1, form: [5,5,4,4,5] },
  { id: 'hamilton',   name: 'Lewis Hamilton',     family: 'HAMILTON',   team: 'ferrari',      pts: 98,  wins: 1, form: [6,6,5,6,6] },
  { id: 'alonso',     name: 'Fernando Alonso',    family: 'ALONSO',     team: 'aston_martin', pts: 87,  wins: 0, form: [7,7,6,7,7] },
  { id: 'sainz',      name: 'Carlos Sainz',       family: 'SAINZ',      team: 'williams',     pts: 76,  wins: 0, form: [8,8,7,8,8] },
  { id: 'perez',      name: 'Sergio Pérez',       family: 'PÉREZ',      team: 'red_bull',     pts: 64,  wins: 0, form: [10,10,9,9,9] },
  { id: 'albon',      name: 'Alex Albon',         family: 'ALBON',      team: 'williams',     pts: 48,  wins: 0, form: [9,9,8,10,10] },
  { id: 'gasly',      name: 'Pierre Gasly',       family: 'GASLY',      team: 'alpine',       pts: 31,  wins: 0, form: [11,11,11,11,11] },
  { id: 'ocon',       name: 'Esteban Ocon',       family: 'OCON',       team: 'haas',         pts: 22,  wins: 0, form: [12,12,12,12,12] },
];

export const CONSTRUCTORS = [
  { id: 'mclaren',      name: 'McLaren',      pts: 339, drivers: ['Norris','Piastri'] },
  { id: 'red_bull',     name: 'Red Bull',     pts: 238, drivers: ['Verstappen','Pérez'] },
  { id: 'ferrari',      name: 'Ferrari',      pts: 236, drivers: ['Leclerc','Hamilton'] },
  { id: 'williams',     name: 'Williams',     pts: 124, drivers: ['Sainz','Albon'] },
  { id: 'mercedes',     name: 'Mercedes',     pts: 112, drivers: ['Russell','Antonelli'] },
  { id: 'aston_martin', name: 'Aston Martin', pts: 87,  drivers: ['Alonso','Stroll'] },
  { id: 'alpine',       name: 'Alpine',       pts: 52,  drivers: ['Gasly','Doohan'] },
  { id: 'haas',         name: 'Haas',         pts: 38,  drivers: ['Ocon','Bearman'] },
];

export const RECENT_RACES = [
  { round:3, name:'Australian GP', short:'AUS', circuit:'Albert Park',  date:'Mar 29', winner:'norris',   winnerTeam:'mclaren',  pole:'norris',    fastest:'piastri' },
  { round:4, name:'Japanese GP',   short:'JPN', circuit:'Suzuka',       date:'Apr 6',  winner:'leclerc',  winnerTeam:'ferrari',  pole:'verstappen',fastest:'leclerc' },
  { round:5, name:'Chinese GP',    short:'CHN', circuit:'Shanghai',     date:'Apr 20', winner:'piastri',  winnerTeam:'mclaren',  pole:'piastri',   fastest:'norris'  },
];

export const NEXT_RACE = {
  round: 6, name: 'Miami Grand Prix', short: 'MIA',
  circuit: 'Miami International Autodrome', country: 'USA', date: 'May 4',
  sessions: [
    { label:'FP1',        day:'Thu', time:'14:30' },
    { label:'FP2',        day:'Fri', time:'10:00' },
    { label:'FP3',        day:'Fri', time:'14:30' },
    { label:'Qualifying', day:'Sat', time:'14:00' },
    { label:'Race',       day:'Sun', time:'15:00' },
  ]
};

export const SEASON_STATS = {
  year: 2026, totalRaces: 24, completedRaces: 5,
  differentWinners: 3, totalDNFs: 8,
  winStreak: { driver: 'NORRIS', count: 2 },
};

export const DRIVER_EXT = {
  norris:     { nat:'British',    age:24, num:4,   starts:118, podiums:21,  poles:5,  fl:8,  dnf:4  },
  verstappen: { nat:'Dutch',      age:27, num:1,   starts:212, podiums:105, poles:41, fl:32, dnf:5  },
  piastri:    { nat:'Australian', age:23, num:81,  starts:43,  podiums:11,  poles:2,  fl:4,  dnf:2  },
  leclerc:    { nat:'Monégasque', age:27, num:16,  starts:145, podiums:44,  poles:24, fl:8,  dnf:12 },
  russell:    { nat:'British',    age:26, num:63,  starts:112, podiums:18,  poles:2,  fl:6,  dnf:6  },
  hamilton:   { nat:'British',    age:41, num:44,  starts:342, podiums:197, poles:104,fl:67, dnf:22 },
  alonso:     { nat:'Spanish',    age:44, num:14,  starts:403, podiums:106, poles:22, fl:23, dnf:31 },
  sainz:      { nat:'Spanish',    age:30, num:55,  starts:192, podiums:28,  poles:6,  fl:12, dnf:14 },
  perez:      { nat:'Mexican',    age:34, num:11,  starts:258, podiums:41,  poles:3,  fl:14, dnf:18 },
  albon:      { nat:'Thai',       age:28, num:23,  starts:97,  podiums:0,   poles:0,  fl:1,  dnf:9  },
  gasly:      { nat:'French',     age:29, num:10,  starts:141, podiums:2,   poles:0,  fl:3,  dnf:13 },
  ocon:       { nat:'French',     age:28, num:31,  starts:138, podiums:3,   poles:0,  fl:2,  dnf:11 },
};

export const TEAM_EXT = {
  mclaren:      { base:'Woking, UK',        principal:'Andrea Stella',    chassis:'MCL39', engine:'Mercedes', founded:1963, titles:8  },
  red_bull:     { base:'Milton Keynes, UK', principal:'Christian Horner', chassis:'RB21',  engine:'RBPT',     founded:2005, titles:6  },
  ferrari:      { base:'Maranello, Italy',  principal:'Frédéric Vasseur', chassis:'SF-26', engine:'Ferrari',  founded:1950, titles:16 },
  mercedes:     { base:'Brackley, UK',      principal:'Toto Wolff',       chassis:'W16',   engine:'Mercedes', founded:1954, titles:8  },
  aston_martin: { base:'Silverstone, UK',   principal:'Mike Krack',       chassis:'AMR25', engine:'Mercedes', founded:2021, titles:0  },
  alpine:       { base:'Enstone, UK',       principal:'Oliver Oakes',     chassis:'A525',  engine:'Renault',  founded:2021, titles:0  },
  williams:     { base:'Grove, UK',         principal:'James Vowles',     chassis:'FW47',  engine:'Mercedes', founded:1977, titles:7  },
  haas:         { base:'Kannapolis, USA',   principal:'Ayao Komatsu',     chassis:'VF-25', engine:'Ferrari',  founded:2016, titles:0  },
};

export function getTeamColor(teamId) {
  return TEAM_COLORS[teamId] || '#e10600';
}

export function getLiveryBg(teamId) {
  const c = getTeamColor(teamId);
  return `repeating-linear-gradient(-55deg, transparent, transparent 9px, ${c}14 9px, ${c}14 10px)`;
}

export function getWinnerName(driverId) {
  const d = DRIVERS.find(d => d.id === driverId);
  return d ? d.family : driverId.toUpperCase();
}

export function getTeamDrivers(teamId) {
  return DRIVERS.filter(d => d.team === teamId);
}

export function getConstructorRank(teamId) {
  return CONSTRUCTORS.findIndex(c => c.id === teamId) + 1;
}
