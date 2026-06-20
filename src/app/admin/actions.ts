'use server';

import {
  adminFetchApplications,
  adminFetchApplicationDetail,
  adminUpdateApplication,
  adminDeleteApplicant,
  adminAddApplication
} from './actions/applications';

import {
  adminFetchLookups,
  adminApproveLookup,
  adminUpdateLookup,
  adminDeleteLookup,
  adminAddLookup
} from './actions/lookups';

export {
  adminFetchApplications,
  adminFetchApplicationDetail,
  adminUpdateApplication,
  adminDeleteApplicant,
  adminAddApplication,
  adminFetchLookups,
  adminApproveLookup,
  adminUpdateLookup,
  adminDeleteLookup,
  adminAddLookup
};
