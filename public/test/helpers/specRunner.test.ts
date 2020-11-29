import { PanelModel } from 'app/features/dashboard/state';

describe('test', () => {
  it('test', () => {
    expect('true').toBe('true');
  });
});

runSpec(
  class GivenTwoPanels {
    dynamicType = {
      prop1: true,
      prop2: 'hello',
    };

    'should be able to access dynamicType with typing'() {
      expect(this.dynamicType.prop2).toBe('hello');
    }

    'should run each test in separate instance'() {
      expect(this.dynamicType.prop1).toBe(true);
    }
  }
);

runSpec(
  class PanelModelTest {
    model = new PanelModel({ type: 'graph' });

    'should set defaults'() {
      expect(this.model.transparent).toBe(false);
    }

    'should init model props'() {
      expect(this.model.type).toBe('graph2');
    }
  }
);

function runSpec(Spec: any) {
  describe(Spec.constructor.name, () => {
    for (const key in Spec.prototype) {
      if (key.indexOf('should') === -1) {
        continue;
      }

      it(key, () => {
        const instance = new Spec();
        instance[key]();
      });
    }
  });
}
