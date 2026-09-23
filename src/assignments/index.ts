import type { ComponentType } from 'react';
import { ResponsivePseudoScatterPlot } from './week-01/ResponsivePseudoScatterPlot';
import { LoadingAndSummarizingData } from './week-02/LoadingAndSumarizingData';
import { FirstVisualization } from './week-03/FirstVisualization';
import { RevisedVisualization } from './week-04/RevisedVis';
import { InteractiveVis } from './week-05/InteractiveVis';



export interface Assignment {
  id: string;
  name: string;
  component: ComponentType;
}

export const assignments: Assignment[] = [
  {
    id: '1',
    name: 'Week 1',
    component: ResponsivePseudoScatterPlot,
  },
  {
    id: '2',
    name: 'Week 2',
    component: LoadingAndSummarizingData,
  },
  {
    id: '3',
    name: 'Week 3',
    component: FirstVisualization,
  },
  {
    id: '4',
    name: 'Week 4',
    component: RevisedVisualization,
  },
  {
    id: '5',
    name: 'Week 5',
    component: InteractiveVis,
  },
];

export const assignmentsMap = new Map(assignments.map((ex) => [ex.id, ex]));

export const defaultAssignment = '1';
