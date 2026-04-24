export type MediaItem = {
  MediaID?: number;
  Media?: string;
  MediaDesc?: string;
  src?: string;
  type?: string;
  url?: string;
  [key: string]: unknown;
};

export type PathSummary = {
  PathID?: number;
  PathName?: string;
  AccessToggle?: number;
  Date?: string;
  Start?: number;
  End?: number;
  PSequenceID?: number;
  StatusID?: number;
  BuildingID?: number;

  Building?: {
    BuildingID?: number;
    BuildingName?: string;
    [key: string]: unknown;
  };

  Status?: {
    StatusID?: number;
    StatusType?: string;
    [key: string]: unknown;
  };

  Destination_Path_StartToDestination?: {
    DestinationID?: number;
    DestinationName?: string;
    [key: string]: unknown;
  };

  Destination_Path_EndToDestination?: {
    DestinationID?: number;
    DestinationName?: string;
    [key: string]: unknown;
  };

  PSequence?:
    | {
        PSequenceID?: number;
        MediaID?: number;
        Next?: number;
        Prev?: number;
        Media_PSequence_MediaIDToMedia?: MediaItem;
        [key: string]: unknown;
      }
    | Array<{
        PSequenceID?: number;
        MediaID?: number;
        Next?: number;
        Prev?: number;
        Media_PSequence_MediaIDToMedia?: MediaItem;
        [key: string]: unknown;
      }>;

  [key: string]: unknown;
};
