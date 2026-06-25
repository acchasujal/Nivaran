import type { IssueType, RiskLevel } from '../api/types';

export interface DemoScenario {
  id: string;
  title: string;
  issueType: IssueType;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  imagePath: string;
  reports: number;
  riskLevel: RiskLevel;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'road-damage',
    title: 'Road Damage',
    issueType: 'road_damage',
    description: 'Deep pothole approximately 60cm wide at Andheri East junction. Road surface degraded, vehicles swerving.',
    locationName: 'Andheri East',
    latitude: 19.1196,
    longitude: 72.8791,
    imagePath: 'demo_pothole1.jpg',
    reports: 3,
    riskLevel: 'high',
  },
  {
    id: 'street-lighting',
    title: 'Street Lighting',
    issueType: 'street_lighting',
    description: 'Non-functional streetlight on Linking Road. Area dark at night. Safety concern for evening pedestrians.',
    locationName: 'Bandra West',
    latitude: 19.0607,
    longitude: 72.8362,
    imagePath: 'demo_streetlight1.jpg',
    reports: 3,
    riskLevel: 'moderate',
  },
  {
    id: 'garbage-overflow',
    title: 'Garbage Overflow',
    issueType: 'garbage',
    description: 'Large pile of uncollected municipal waste overflowing onto public footpath, attracting pests.',
    locationName: 'Juhu',
    latitude: 19.1000,
    longitude: 72.8258,
    imagePath: 'demo_garbage1.jpg',
    reports: 5,
    riskLevel: 'high',
  },
  {
    id: 'water-leakage',
    title: 'Water Leakage',
    issueType: 'water',
    description: 'Major pipeline burst resulting in clean drinking water flooding the street. Low water pressure in nearby buildings.',
    locationName: 'Powai',
    latitude: 19.1200,
    longitude: 72.9050,
    imagePath: 'demo_leak1.jpg',
    reports: 2,
    riskLevel: 'moderate',
  },
  {
    id: 'broken-footpath',
    title: 'Broken Footpath',
    issueType: 'footpath',
    description: 'Completely broken and displaced concrete slabs on busy pedestrian footpath, causing tripping hazards.',
    locationName: 'Dadar West',
    latitude: 19.0178,
    longitude: 72.8300,
    imagePath: 'demo_sidewalk.jpg',
    reports: 4,
    riskLevel: 'moderate',
  },
  {
    id: 'illegal-dumping',
    title: 'Illegal Dumping',
    issueType: 'dumping',
    description: 'Unauthorized dumping of construction debris on the roadside, blocking one lane of vehicle traffic.',
    locationName: 'Colaba',
    latitude: 18.9067,
    longitude: 72.8147,
    imagePath: 'demo_construction.jpg',
    reports: 2,
    riskLevel: 'low',
  },
];
