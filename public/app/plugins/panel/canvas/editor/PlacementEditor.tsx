import React, { FC } from 'react';
import { useObservable } from 'react-use';
import { Subject } from 'rxjs';

import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Field, InlineField, InlineFieldRow, Select, VerticalGroup } from '@grafana/ui';
import { HorizontalConstraint, Placement, VerticalConstraint } from 'app/features/canvas';
import { ElementState } from 'app/features/canvas/runtime/element';
import { NumberInput } from 'app/features/dimensions/editors/NumberInput';

import { PanelOptions } from '../models.gen';

import { CanvasEditorOptions } from './elementEditor';

const places: Array<keyof Placement> = ['top', 'left', 'bottom', 'right', 'width', 'height'];

const horizontalOptions: Array<SelectableValue<HorizontalConstraint>> = [
  { label: 'Left', value: HorizontalConstraint.Left },
  { label: 'Right', value: HorizontalConstraint.Right },
  { label: 'Left and right', value: HorizontalConstraint.LeftRight },
  { label: 'Center', value: HorizontalConstraint.Center },
  { label: 'Scale', value: HorizontalConstraint.Scale },
  { label: 'Mixed', value: HorizontalConstraint.Mixed },
];

const verticalOptions: Array<SelectableValue<VerticalConstraint>> = [
  { label: 'Top', value: VerticalConstraint.Top },
  { label: 'Bottom', value: VerticalConstraint.Bottom },
  { label: 'Top and bottom', value: VerticalConstraint.TopBottom },
  { label: 'Center', value: VerticalConstraint.Center },
  { label: 'Scale', value: VerticalConstraint.Scale },
  { label: 'Mixed', value: VerticalConstraint.Mixed },
];

export const PlacementEditor: FC<StandardEditorProps<any, CanvasEditorOptions, PanelOptions>> = ({ item }) => {
  const settings = item.settings;

  // Will force a rerender whenever the subject changes
  useObservable(settings?.scene ? settings.scene.moved : new Subject());

  if (!settings) {
    return <div>Loading...</div>;
  }

  let elements: ElementState[] = [];
  if (settings.selectedElements) {
    elements = settings.selectedElements;
  } else {
    elements = [settings.element];
  }

  const onHorizontalConstraintChange = (h: SelectableValue<HorizontalConstraint>) => {
    elements.map((element) => {
      element.options.constraint!.horizontal = h.value;
      element.setPlacementFromConstraint();
      settings.scene.revId++;
      settings.scene.save(true);
    });
  };

  const onVerticalConstraintChange = (v: SelectableValue<VerticalConstraint>) => {
    elements.map((element) => {
      element.options.constraint!.vertical = v.value;
      element.setPlacementFromConstraint();
      settings.scene.revId++;
      settings.scene.save(true);
    });
  };

  // const onPositionChange = (value: number | undefined, placement: keyof Placement) => {
  //   element.options.placement![placement] = value ?? element.options.placement![placement];
  //   element.applyLayoutStylesToDiv();
  //   settings.scene.clearCurrentSelection();
  // };

  const vConstraint = calculateVerticalConstraint(elements);
  const hConstraint = calculateHorizontalConstraint(elements);

  return (
    <div>
      <VerticalGroup>
        <Select options={verticalOptions} onChange={onVerticalConstraintChange} value={vConstraint} />
        <Select options={horizontalOptions} onChange={onHorizontalConstraintChange} value={hConstraint} />
      </VerticalGroup>
      <br />

      {/* <Field label="Position">
        <>
          {places.map((p) => {
            const v = placement![p];
            if (v == null) {
              return null;
            }
            return (
              <InlineFieldRow key={p}>
                <InlineField label={p} labelWidth={8} grow={true}>
                  <NumberInput value={v} onChange={(v) => onPositionChange(v, p)} />
                </InlineField>
              </InlineFieldRow>
            );
          })}
        </>
      </Field> */}
    </div>
  );
};

const calculateVerticalConstraint = (elements: ElementState[]): VerticalConstraint => {
  let vConstraint = elements[0].options.constraint?.vertical ?? VerticalConstraint.Mixed;

  elements.map((element) => {
    if (element.options.constraint?.vertical !== vConstraint) {
      vConstraint = VerticalConstraint.Mixed;
    }
  });

  return vConstraint;
};

const calculateHorizontalConstraint = (elements: ElementState[]): HorizontalConstraint => {
  let hConstraint = elements[0].options.constraint?.horizontal ?? HorizontalConstraint.Mixed;

  elements.map((element) => {
    if (element.options.constraint?.horizontal !== hConstraint) {
      hConstraint = HorizontalConstraint.Mixed;
    }
  });

  return hConstraint;
};
