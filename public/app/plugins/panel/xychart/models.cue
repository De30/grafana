package grafanaplugin

import (
	"github.com/grafana/thema"
	ui "github.com/grafana/grafana/packages/grafana-schema/src/schema"
)

Panel: thema.#Lineage & {
	name: "xychart"
	seqs: [
		{
			schemas: [
				{
					PanelOptions: {
                        show?: ScatterShow
                        lineWidth?: number
                        lineStyle?: LineStyle
                        lineColor?: ColorDimensionConfig
                        pointSize?: ScaleDimensionConfig
                        pointColor?: ColorDimensionConfig
                        pointSymbol?: DimesionSupplier<string>
                        label?: ui.VisibilityMode
                        labeValue?: TextDimensionConfig

						ui.OptionsWithLegend
						ui.OptionsWithTooltip
						ui.OptionsWithTextFormatting
						// TODO docs
						xField?: string
						// TODO docs
						colorByField?: string
						// TODO docs
						orientation: ui.VizOrientation | *"auto"
						// TODO docs
						barRadius?: float64 & >= 0 & <= 0.5 | *0
						// TODO docs
						xTickLabelRotation: int32 & >= -90 & <= 90 | *0
						// TODO docs
						xTickLabelMaxLength: int32 & >= 0
						// TODO docs
						// negative values indicate backwards skipping behavior
						xTickLabelSpacing?: int32 | *0
						// TODO docs
						stacking:   ui.StackingMode | *"none"
						// This controls whether values are shown on top or to the left of bars.
						showValue:  ui.VisibilityMode | *"auto"
						// Controls the width of bars. 1 = Max width, 0 = Min width.
						barWidth:   float64 & >= 0 & <= 1 | *0.97
						// Controls the width of groups. 1 = max with, 0 = min width.
						groupWidth: float64 & >= 0 & <= 1 | *0.7
					} @cuetsy(kind="interface")
					PanelFieldConfig: {
						ui.AxisConfig
						ui.HideableFieldConfig
						// Controls line width of the bars.
						lineWidth?:    int32 & >= 0 & <= 10 | *1
						// Controls the fill opacity of the bars.
						fillOpacity?:  int32 & >= 0 & <= 100 | *80
						// Set the mode of the gradient fill. Fill gradient is based on the line color. To change the color, use the standard color scheme field option.
            // Gradient appearance is influenced by the Fill opacity setting.
						gradientMode?: ui.GraphGradientMode | *"none"
					} @cuetsy(kind="interface")
				},
			]
		},
	]
}