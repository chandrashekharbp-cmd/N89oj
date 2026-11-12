/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TPWODL Titlagarh Section initial data module.
 * Per specification: All preloaded consumer records have been removed so the application
 * starts with ZERO (0) records on initial startup until an Excel file is manually imported.
 */
import { Consumer } from "../types";

export const PRELOADED_CONSUMERS: Consumer[] = [];
