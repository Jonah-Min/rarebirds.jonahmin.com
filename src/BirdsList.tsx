import { Fragment } from 'react';
import { type BirdData } from './types';

type BirdsListProps = {
  birds: BirdData[] | null;
};

export default function BirdsList({ birds }: BirdsListProps) {
  const birdCountsByName = birds ? birds.reduce((acc, bird) => {
    const { comName, howMany, speciesCode, subId } = bird;

    if (!acc[comName]) {
      acc[comName] = {
        count: 0,
        code: speciesCode,
        checklist: subId
      };
    }

    acc[comName].count += howMany;
    return acc;
  }, {} as Record<string, { count: number; code: string; checklist: string; }>) : {};

  return <div className={`sightings ${birds ? 'selected' : ''}`}>
    {birds &&
      <div style={{ paddingLeft: '4%', paddingTop: '4%', display: 'flex', flexDirection: 'column' }}>
        <h1 className="bird-list-header">{birds[0].locName}</h1>
        {Object.entries(birdCountsByName).map(([birdName, info]) => {
          const { count, code, checklist } = info;

          const ebirdLink = `https://ebird.org/species/${code}`;
          const checklistLink = `https://ebird.org/checklist/${checklist}`;
          const photosLink = `https://search.macaulaylibrary.org/catalog?taxonCode=${code}&sort=rating_rank_desc`;

          return <Fragment key={birdName}>
            <span className="bird-sighting">
              <span className="count">{count} x</span>
              <strong>
                <a className="bird-name" href={ebirdLink} target='_blank' >{birdName}</a>
              </strong>
              <br />
              <div className="extra-info">
                <a href={checklistLink} target='_blank' >Checklist</a>
                <br />
                <a href={photosLink} target='_blank' >Macaulay library</a>
              </div>
            </span>
          </Fragment>;
        })}

      </div>
    }
  </div>;
}