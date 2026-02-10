import { Fragment } from 'react';
import { type BirdData } from './types';

type BirdsListProps = {
  birds: BirdData[] | null;
};

export default function BirdsList({ birds }: BirdsListProps) {
  const birdCountsByName = birds ? birds.reduce((acc, bird) => {
    const { comName, howMany } = bird;
    if (!acc[comName]) acc[comName] = 0;
    acc[comName] += howMany;
    return acc;
  }, {} as Record<string, number>) : {};

  return <div className={`sightings ${birds ? 'selected' : ''}`}>
    {birds &&
      <div style={{ paddingLeft: '4%', paddingTop: '4%' }}>
        {Object.entries(birdCountsByName).map(([birdName, count]) => {
          return <Fragment key={birdName}>
            <span style={{ textAlign: "left", fontSize: '20px', fontWeight: 'bold' }}>{birdName}</span>
            <br />
            <span>count: {count}</span>
            <br />
            <br />
          </Fragment>;
        })}

      </div>
    }
  </div>;
}