// AUTO-GENERATED FILE.
// DO NOT EDIT MANUALLY.

import { officeToMD } from "../reference/office.ts";
import { adocToHTML } from "../reference/adoc.ts";
import { rstToHTML } from "../reference/rst.ts";

export default {
  docx: [
    officeToMD,
  ],
  md: [
  ],
  txt: [
  ],
  adoc: [
    adocToHTML,
    officeToMD,
  ],
  rst: [
    rstToHTML,
    officeToMD,
  ],
};
