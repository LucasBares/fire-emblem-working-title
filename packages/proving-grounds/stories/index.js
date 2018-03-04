// @flow
import React from 'react';
import { action, storiesOf } from '@storybook/react';
import { drop } from 'ramda';
import { withReducer, withState } from 'recompose';
import { getHero } from 'fire-emblem-heroes-stats';
import { getDefaultInstance } from 'fire-emblem-heroes-calculator';
import type { HeroInstance } from 'fire-emblem-heroes-calculator';

import Frame from '../src/components/Frame';
import Hero from '../src/components/Hero';
import HeroBuilder from '../src/components/HeroBuilder';
import ImportExportPanel from '../src/components/ImportExportPanel';
import Input from '../src/components/Input';
import RaritySelector from '../src/components/RaritySelector';
import Select from '../src/components/Select';
import SegmentedControl from '../src/components/SegmentedControl';
import Skill from '../src/components/Skill';
import SkillSelector from '../src/components/SkillSelector';
import StatSheet from '../src/components/StatSheet';
import Toast from '../src/components/Toast';
import { colors } from '../src/theme';
import type { Dispatch } from '../src/reducer';


const heroInstance: HeroInstance = getDefaultInstance('Anna');

storiesOf('Frame', module)
  .add('default', () => (
    <div className="root">
      <style jsx>{`
        .root {
          display: inline-block;
          border: 2px solid black;
          }
      `}</style>
      <Frame rarity={5} />
    </div>
  ));

storiesOf('Hero', module)
  .add('default', () => (
    <Hero
      assets={getHero(heroInstance.name).assets}
      name={heroInstance.name}
      weaponType={getHero(heroInstance.name).weaponType}
    />
  ));

storiesOf('HeroBuilder', module)
  .add('default', () => {
    const ACTION = action;
    const reducer = (state, action) => {
      switch (action.type) {
        case 'SET_PREVIEW_LEVEL':
          return {
            ...state,
            level: action.level,
          };
        case 'UPDATE_BANE':
          return {
            ...state,
            heroInstance: {
              ...state.heroInstance,
              bane: action.bane,
            },
          };
        case 'UPDATE_BOON':
          return {
            ...state,
            heroInstance: {
              ...state.heroInstance,
              boon: action.boon,
            },
          };
        case 'UPDATE_RARITY':
          return {
            ...state,
            heroInstance: {
              ...state.heroInstance,
              rarity: action.rarity,
            },
          };
        default:
          ACTION(action.type)(action);
          return state;
      }
    };

    const HeroBuilderStory = withReducer(
      'state',
      'dispatch',
      reducer,
      { heroInstance, level: 1 },
    )(
      ({ state, dispatch }: { state: Object; dispatch: Dispatch }) => (
        <HeroBuilder
          dispatch={dispatch}
          heroInstance={state.heroInstance}
          level={state.level}
        />
      ),
    );

    return <HeroBuilderStory />;
  });

storiesOf('ImportExportPanel', module)
  .add('default', () => (
    <div className="root">
      <style jsx>{`
        .root {
          background: ${colors.elephant};
        }
      `}</style>
      <ImportExportPanel
        dispatch={() => {}}
        onChange={action('VALUE_CHANGE')}
        value={`Anna (5★)
Weapon: Noatun
Special: Astra
B: Vantage 3
C: Spur Res 3`}
      />
    </div>
  ));

storiesOf('Input', module)
  .add('default', () => (
    <Input onChange={() => {}} value="" />
  ));

storiesOf('RaritySelector', module)
  .add('default', () => {
    const RaritySelectorStory = withState('selected', 'setSelected', 4)(
      ({ selected, setSelected }) => (
        <RaritySelector
          disabled={[true, true, false, false, false]}
          onChange={setSelected}
          selected={selected}
        />
      ),
    );
    return <RaritySelectorStory />;
  });

storiesOf('Select', module)
  .add('default', () => {
    const SelectStory = withState('selected', 'onChange', 0)(
      ({ selected, onChange }) => (
        <div style={{ background: colors.elephant, padding: '150px 30px' }}>
          <Select
            onChange={onChange}
            options={['—', 'HP', 'Atk', 'Spd', 'Def', 'Res']}
            selected={selected}
          />
        </div>
      ));
    return <SelectStory />;
  });

storiesOf('SegmentedControl', module)
  .add('default', () => {
    const SegmentedControlStory = withState('selected', 'setSelected', 0)(
      ({ selected, setSelected }) => (
        <div style={{ background: colors.elephant, padding: 30 }}>
          <SegmentedControl
            onChange={setSelected}
            options={['Lv 1', 'Lv 40']}
            selected={selected}
          />
        </div>
      ),
    );
    return <SegmentedControlStory />;
  });

storiesOf('Skill', module)
  .add('Weapon', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill name="Nóatún" type='WEAPON' onClick={action('CLICKED_SKILL')} />
    </div>
  ))
  .add('Weapon: active', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Nóatún" type='WEAPON' onClick={action('CLICKED_SKILL')} />
    </div>
  ))
  .add('Weapon: show guide', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill name="Nóatún" type='WEAPON' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ))
  .add('Weapon: show guide & active', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Nóatún" type='WEAPON' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ))
  .add('Assist: show guide & active', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Rally Attack" type='ASSIST' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ))
  .add('Special: show guide & active', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Astra" type='SPECIAL' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ))
  .add('Passive: show guide & active', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Vantage 3" type='PASSIVE_B' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ))
  .add('Invalid skillname', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <Skill active name="Something Else" type='SEAL' onClick={action('CLICKED_SKILL')} showGuide />
    </div>
  ));

storiesOf('SkillSelector', module)
  .add('Anna, Weapon', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <SkillSelector
        activeSkillName=""
        dispatch={() => {}}
        heroInstance={heroInstance}
        onClose={action('UPDATE_SKILL')}
        showGuide
        skillType="WEAPON"
      />
    </div>
  ))
  .add('Anna, Special', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <SkillSelector
        activeSkillName=""
        dispatch={() => {}}
        heroInstance={heroInstance}
        onClose={action('UPDATE_SKILL')}
        showGuide
        skillType="SPECIAL"
      />
    </div>
  ))
  .add('Anna, Passive A', () => (
    <div style={{ background: colors.elephant, padding: '30px' }}>
      <SkillSelector
        activeSkillName=""
        dispatch={() => {}}
        heroInstance={heroInstance}
        onClose={action('UPDATE_SKILL')}
        showGuide
        skillType="PASSIVE_A"
      />
    </div>
  ));

storiesOf('StatSheet', module)
  .add('Anna: default', () => (
    <div style={{ background: colors.elephant, padding: 30 }}>
      <StatSheet
        heroInstance={heroInstance}
        level={40}
        rarity={5}
      />
    </div>
  ));

storiesOf('Toast', module)
  .add('default', () => {
    const reducer = (messages, action) => {
      if (action.type === 'DEQUEUE_NOTIFICATION') {
        return drop(1, messages);
      }
      return messages;
    };

    const init = ['Not enough energy', 'You must construct additional pylons!'];

    const ToastDemo = withReducer('messages', 'dispatch', reducer, init)(
      ({ dispatch, messages }) => (
        <div className="root">
          <style jsx>{`
            .root {
              border: 1px solid violet;
              height: 200px;
              position: relative;
            }
          `}</style>
          <Toast dispatch={dispatch} messages={messages} />
        </div>
      ),
    );

    return <ToastDemo />;
  });
