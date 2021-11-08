import "app/angular/dropdown_typeahead";
import "app/angular/autofill_event_fix";
import "app/angular/metric_segment";
import "app/angular/misc";
import "app/angular/ng_model_on_blur";
import "app/angular/tags";
import "app/angular/rebuild_on_change";
import "app/angular/give_focus";
import "app/angular/diff-view";
import "app/core/jquery_extended";
import "app/core/components/jsontree/jsontree";
import "app/core/components/code_editor/code_editor";
import "app/core/components/colorpicker/spectrum_picker";
import "app/core/services/search_srv";
import "app/core/services/ng_react";
import { colors, JsonExplorer } from "@grafana/ui/";

import { infoPopover } from "app/core/components/info_popover";
import { arrayJoin } from "app/angular/array_join";
import { switchDirective } from "./components/switch";
import { dashboardSelector } from "./components/dashboard_selector";
import { queryPartEditorDirective } from "app/core/components/query_part/query_part_editor";
import { sqlPartEditorDirective } from "app/core/components/sql_part/sql_part_editor";
import { formDropdownDirective } from "app/core/components/form_dropdown/form_dropdown";
import "app/core/services/all";
import "./filters/filters";
import coreModule from "app/core/core_module";
import appEvents from "app/core/app_events";
import { assignModelProperties } from "app/core/utils/model_utils";
import { contextSrv } from "app/core/services/context_srv";
import { KeybindingSrv } from "app/core/services/keybindingSrv";
import { NavModelSrv } from "app/core/nav_model_srv";
import { geminiScrollbar } from "app/core/components/scroll/scroll";
import { profiler } from "app/core/profiler";
import { registerAngularDirectives } from "app/core/angular_wrappers";
import TimeSeries, { updateLegendValues } from "app/core/time_series2";
import { NavModel } from "@grafana/data";

export {
  profiler,
  registerAngularDirectives,
  arrayJoin,
  coreModule,
  switchDirective,
  infoPopover,
  appEvents,
  dashboardSelector,
  queryPartEditorDirective,
  sqlPartEditorDirective,
  colors,
  formDropdownDirective,
  assignModelProperties,
  contextSrv,
  KeybindingSrv,
  JsonExplorer,
  NavModelSrv,
  NavModel,
  geminiScrollbar,
  TimeSeries,
  updateLegendValues,
};
