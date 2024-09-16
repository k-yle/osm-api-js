import { osmFetch } from "./_osmFetch";

export type ApiStatus = "online" | "offline";

export type ApiCapabilities = {
  version: string;
  generator: string;
  copyright: string;
  attribution: string;
  license: string;
  api: {
    version: {
      minimum: string;
      maximum: string;
    };
    area: {
      maximum: number;
    };
    note_area: {
      maximum: number;
    };
    tracepoints: {
      per_page: number;
    };
    waynodes: {
      maximum: number;
    };
    relationmembers: {
      maximum: number;
    };
    changesets: {
      maximum_elements: number;
      default_query_limit: number;
      maximum_query_limit: number;
    };
    notes: {
      default_query_limit: number;
      maximum_query_limit: number;
    };
    timeout: {
      seconds: number;
    };
    status: {
      database: ApiStatus;
      api: ApiStatus;
      gpx: ApiStatus;
    };
  };
  policy: {
    imagery: {
      blacklist: { regex: string }[];
    };
  };
};

/** This API provides information about the capabilities and limitations of the current API. */
export async function getApiCapabilities(): Promise<ApiCapabilities> {
  return osmFetch<ApiCapabilities>("/capabilities.json");
}

// ---------------------------------------------------------------------- //

/** @deprecated Use {@link getApiCapabilities} instead */
export type OsmCapabilities = {
  limits: {
    maxArea: number;
    maxNoteArea: number;
    maxTracepointPerPage: number;
    maxWayNodes: number;
    maxChangesetElements: number;
    maxTimeout: number;
  };
  policy: {
    imageryBlacklist: string[];
  };
};

/**
 * @deprecated Use {@link getApiCapabilities} instead. This method was
 * created before the API supported JSON, and it does not contain every
 * field.
 */
export async function getCapabilities(): Promise<OsmCapabilities> {
  const raw = await getApiCapabilities();

  const out: OsmCapabilities = {
    limits: {
      maxArea: raw.api.area.maximum,
      maxNoteArea: raw.api.note_area.maximum,
      maxTracepointPerPage: raw.api.tracepoints.per_page,
      maxWayNodes: raw.api.waynodes.maximum,
      maxChangesetElements: raw.api.changesets.maximum_elements,
      maxTimeout: raw.api.timeout.seconds,
    },
    policy: {
      imageryBlacklist: raw.policy.imagery.blacklist.map((item) => item.regex),
    },
  };

  return out;
}
