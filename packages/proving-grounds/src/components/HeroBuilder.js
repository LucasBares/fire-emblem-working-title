// @flow
import React from 'react';
import MinusSquare from 'react-icons/lib/fa/minus-square';
import PlusSquare from 'react-icons/lib/fa/plus-square';
import {
  compose,
  equals,
  filter,
  keys,
  mapObjIndexed,
  not,
  pathOr,
  values,
  zipObj,
} from 'ramda';
import { withState } from 'recompose';
import { getHero } from 'fire-emblem-heroes-stats';
import type { HeroInstance, InstanceSkills, Rarity } from 'fire-emblem-heroes-calculator';
import type { Hero, SkillType } from 'fire-emblem-heroes-stats';

import RaritySelector from './RaritySelector';
import SegmentedControl from './SegmentedControl';
import Select from './Select';
import Skill from './Skill';
import SkillSelector from './SkillSelector';
import StatSheet from './StatSheet';
import { colors, fontFamilies, fontSizes, lineHeights, transition } from '../theme';
import { staticUrl } from '../../config';
import type { Dispatch } from '../reducer';


// eslint-disable-next-line
type Props = {|
  +dispatch: Dispatch;
  +heroInstance: HeroInstance;
  +showGuide: boolean;
  +level: 1 | 40;
|};

// eslint-disable-next-line
type State = {
  open: true;
  skillType: SkillType;
} | {
  open: false;
  skillType: void;
};

const skillIcons = {
  ASSIST: 'Icon_Skill_Assist.png',
  PASSIVE_A: 'Passive_Icon_A.png',
  PASSIVE_B: 'Passive_Icon_B.png',
  PASSIVE_C: 'Passive_Icon_C.png',
  SPECIAL: 'Icon_Skill_Special.png',
  WEAPON: 'Icon_Skill_Weapon.png',
  SEAL: 'Seal_Icon.png',
};

const hasStatsForRarity = (instance: HeroInstance, rarity: Rarity): boolean => {
  const hero: Hero = getHero(instance.name);
  return Boolean(hero.stats['1'][`${rarity}`] && hero.stats['40'][`${rarity}`]);
};

const HeroBuilder = withState(
  'state',
  'setState',
  { open: false, skillType: undefined },
)(({
  dispatch,
  heroInstance,
  level,
  setState,
  showGuide,
  state,
  // eslint can't parse type spreads yet: https://github.com/babel/babylon/pull/418
}/* : { ...Props, +setState: (state: State) => void; +state: State; } */) => {

  const varianceOptions = {
    HP: 'hp',
    ATK: 'atk',
    SPD: 'spd',
    DEF: 'def',
    RES: 'res',
  };

  const mergeLevel = heroInstance.mergeLevel === undefined ? 0 : heroInstance.mergeLevel;

  const invertObject = (obj) => zipObj(values(obj), keys(obj));

  return (
    <div className="root">
      <style jsx>{`
        .root {
          align-items: center;
          background-clip: padding-box;
          /* average of border-image color */
          background-color: #1c4654;
          border: 46px solid transparent;
          border-image: url(${staticUrl}Border_Blue.png) 46 fill stretch;
          display: flex;
          flex-direction: column;
        }
        .active-skill {
          position: relative;
        }
        .active-skill:not(:last-of-type) {
          margin-bottom: 10px;
        }
        .adjust-merge-level {
          background: none;
          border: none;
          color: ${colors.fadedJade};
          cursor: pointer;
          font-size: 24px;
          margin: 0 -4px;
          padding: 0 4px;
          transition: color ${transition};
        }
        .adjust-merge-level:hover {
          color: ${colors.aquaIsland};
        }
        .adjust-merge-level:focus {
          outline: none;
        }
        .column {
          display: flex;
          flex-direction: column;
          margin-left: 15px;
        }
        .row {
          align-items: baseline;
          color: ${colors.iceberg};
          display: flex;
          font-family: ${fontFamilies.ui};
          font-size: ${fontSizes.medium}px;
          font-weight: bold;
          justify-content: space-between;
          padding-left: 0.75em;
          position: relative;
        }
        .section {
          width: 250px;
          margin: 0 auto 25px;
          max-width: 100%;
        }
        .skill-icon {
          height: 30px;
          pointer-events: none;
          position: absolute;
          width: 30px;
          z-index: 1;
          right: 20px;
          top: 50%;
          transform: translate(50%, -50%);
        }
        .skill-selector {
          width: 100%;
        }
        .center {
          display: flex;
          justify-content: space-around;
        }
        .name {
          color: ${colors.iceberg};
          font-family: ${fontFamilies.ui};
          font-size: ${fontSizes.medium}px;
          line-height: ${lineHeights.body};
          margin: 0;
          text-align: center;
        }
      `}</style>
      {!state.open
        ? (
          <div>
            <div className="section">
              <div className="row" style={{ alignItems: 'center' }}>
                <div style={{ flexGrow: 1 }}>
                  <SegmentedControl
                    options={[
                      'Lv 1',
                      `Lv 40${mergeLevel > 0 ? `+${mergeLevel}` : ''}`,
                    ]}
                    selected={level === 1 ? 0 : 1}
                    onChange={i => dispatch({ type: 'SET_PREVIEW_LEVEL', level: ([1, 40])[i] })}
                  />
                </div>
                <div className="column">
                  <button
                    className="adjust-merge-level"
                    onClick={() => dispatch({
                      type: 'SET_MERGE_LEVEL',
                      value: mergeLevel + 1,
                    })}
                  >
                    <PlusSquare style={{ display: 'block' }} />
                  </button>
                  <button
                    className="adjust-merge-level"
                    onClick={() => dispatch({
                      type: 'SET_MERGE_LEVEL',
                      value: heroInstance.mergeLevel - 1,
                    })}
                  >
                    <MinusSquare style={{ display: 'block' }} />
                  </button>
                </div>
              </div>
            </div>
            <div className="section">
              <h1 className="name">{heroInstance.name}</h1>
            </div>
            <div className="section">
              <StatSheet
                heroInstance={heroInstance}
                level={level}
              />
            </div>
            <div className="section center">
              <RaritySelector
                disabled={[
                  !hasStatsForRarity(heroInstance, 1),
                  !hasStatsForRarity(heroInstance, 2),
                  !hasStatsForRarity(heroInstance, 3),
                  !hasStatsForRarity(heroInstance, 4),
                  !hasStatsForRarity(heroInstance, 5),
                ]}
                selected={heroInstance.rarity}
                onChange={rarity => dispatch({ type: 'UPDATE_RARITY', rarity })}
              />
            </div>
            <div className="section" style={{ width: 175 }}>
              <div className="row">
                Boon
                <div style={{ flexBasis: 75 }}>
                  <Select
                    onChange={selected => dispatch({
                      type: 'UPDATE_BOON',
                      stat: varianceOptions[selected],
                    })}
                    options={[
                      '—',
                      ...keys(filter(compose(not, equals(heroInstance.bane)), varianceOptions)),
                    ]}
                    selected={heroInstance.boon
                      // $FlowIssue: Flow isn't thinks invertObject might have side effects
                      ? invertObject(varianceOptions)[heroInstance.boon]
                      : '—'}
                  />
                </div>
              </div>
              <div className="row">
                Bane
                <div style={{ flexBasis: 75 }}>
                  <Select
                    onChange={selected => dispatch({
                      type: 'UPDATE_BANE',
                      stat: varianceOptions[selected],
                    })}
                    options={[
                      '—',
                      ...keys(filter(compose(not, equals(heroInstance.boon)), varianceOptions)),
                    ]}
                    selected={heroInstance.bane
                      // $FlowIssue: Flow isn't thinks invertObject might have side effects
                      ? invertObject(varianceOptions)[heroInstance.bane]
                      : '—'}
                  />
                </div>
              </div>
            </div>
            <div className="section">
              {
                // $FlowIssue: I think flow thinks skillType could be any string.
                values(mapObjIndexed(
                  (skill: string | void, skillType: SkillType) => (
                    <div
                      key={skillType}
                      className="active-skill"
                    >
                      <img
                        className="skill-icon"
                        src={`${staticUrl}30px-${skillIcons[skillType]}`}
                        srcSet={`
                          ${staticUrl}30px-${skillIcons[skillType]} 30w,
                          ${staticUrl}60px-${skillIcons[skillType]} 60w
                        `}
                        sizes="30px"
                      />
                      <Skill
                        name={skill || '--'}
                        type={skillType}
                        onClick={() => { setState({ open: true, skillType: skillType }); }}
                      />
                    </div>
                  ),
                  ({
                    // Enumerate all properties to ensure they are all iterable.
                    // This fixes issue #52
                    WEAPON: undefined,
                    ASSIST: undefined,
                    SPECIAL: undefined,
                    PASSIVE_A: undefined,
                    PASSIVE_B: undefined,
                    PASSIVE_C: undefined,
                    SEAL: undefined,
                    ...heroInstance.skills,
                  }: InstanceSkills),
                ))
              }
            </div>
          </div>
        )
        : (
          <div className="skill-selector">
            <SkillSelector
              // $FlowIssue: Flowtype for pathOr isn't precise.
              activeSkillName={pathOr(
                '',
                ['skills', state.skillType],
                heroInstance,
              )}
              onClose={skillName => {
                // This one is technically correct, skillType could be voided before the
                // callback is triggered.  But I know it won't be.
                // $FlowIssue
                dispatch({
                  type: 'UPDATE_SKILL',
                  skillType: state.skillType,
                  skill: skillName,
                });
                setState({ open: false, skillType: undefined });
              }}
              dispatch={dispatch}
              showGuide={showGuide}
              heroInstance={heroInstance}
              skillType={state.skillType}
            />
          </div>
        )
      }
    </div>
  );
});

export default HeroBuilder;
