// NOT currently generated... but it sure should be!

// Converters
//---------------------------------------

export interface JsonAutoConverterConfig {}

export interface JsonExactConverterConfig {}

export interface InfluxAutoConverterConfig {
  frameFormat?: 'labels_column';
}

export interface JsonFrameConverterConfig {}

// Data outputters
//---------------------------

export interface BuiltinDataOutputterConfig {}

export interface RedirectDataOutputterConfig {}

// Frame outputter

export interface ManagedStreamFrameOutputterConfig {}
export interface ConditionalFrameOutputterConfig {
  condition: string;
  output: string;
}
export interface RedirectFrameOutputterConfig {}
export interface ChangelogFrameOutputterConfig {}
export interface RemoteWriteFrameOutputterConfig {}

// frameProcessors

export interface KeepFieldsFrameProcessorConfig {}
export interface DropFieldsFrameProcessorConfig {}

// subscribers: [

export interface BuildtinSubscriberConfig {}
export interface ManagedStreamSubscriberConfig {}
