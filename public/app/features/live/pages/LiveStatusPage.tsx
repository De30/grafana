import React from 'react';
import Page from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { converters } from '../pipeline/converters/registry';
import { Registry, RegistryItem, SelectableValue } from '@grafana/data';
import { subscribers } from '../pipeline/subscribers/registry';
import { frameProcessors } from '../pipeline/frameProcessors/registry';
import { frameOutputs } from '../pipeline/frameOutputters/registry';
import { dataOutputters } from '../pipeline/dataOutputters/registry';
import { Field } from '@grafana/ui';

const sections: Array<SelectableValue<Registry<RegistryItem>>> = [
  {
    label: 'Subscribers',
    value: subscribers as any,
  },
  {
    label: 'Converters',
    value: converters as any,
  },
  {
    label: 'Frame processors',
    value: frameProcessors as any,
  },
  {
    label: 'Frame outputters',
    value: frameOutputs as any,
  },
  {
    label: 'Data outputters',
    value: dataOutputters as any,
  },
];

export default function LiveStatusPage() {
  const navModel = useNavModel('live-status');

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h1>Live/Live/Live</h1>
        <hr />
        {sections.map((section) => (
          <div key={section.label!}>
            <h2>{section.label!}</h2>
            <div>
              {section.value!.list().map((v) => (
                <Field key={v.id} label={v.name} description={v.description}>
                  <span></span>
                </Field>
              ))}
            </div>
          </div>
        ))}
      </Page.Contents>
    </Page>
  );
}
