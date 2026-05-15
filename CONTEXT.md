# Resume Editor

This context defines the canonical language for Jobi's resume editor so product, design, and code can talk about resume content without mixing domain terms with UI terms.

## Language

**Application Resume**:
The candidate-facing resume content saved for a specific job application and tailored against one job description.
_Avoid_: Master resume, generic profile

**Uploaded Resume**:
The original resume file provided by the user as the source for a specific job application before the system parses or rewrites it.
_Avoid_: Application resume, editable resume, reusable asset

**Job Application**:
The application record that binds one application resume to one job description.
_Avoid_: Resume session, editor state

**Job Description**:
The target role description that an application resume is tailored against and may be updated during the application process.
_Avoid_: JD

**UI Language**:
The language used by the Jobi application interface, such as navigation, buttons, and system messages.
_Avoid_: Resume language, content language

**Resume Language**:
The language used by the content of an application resume and kept stable during normal editing.
_Avoid_: UI language, section label language

**Evaluation Report**:
A derived analysis of an application resume against its job description, with only the current report kept active.
_Avoid_: Resume content, resume section

**Exported Resume**:
A file artifact generated from an application resume for printing or download.
_Avoid_: Application resume, editable resume

**Chat Session**:
The single AI conversation thread attached to one application resume.
_Avoid_: Chat history list, multi-session workspace

**Suggestion**:
A suggestion item presented as part of an evaluation report, temporarily covering both assessment findings and recommended changes.
_Avoid_: Saved edit, applied change

**Section Order**:
The ordered sequence in which sections appear within an application resume.
_Avoid_: Template-only order, layout detail

**Section**:
A predefined content group within a resume, such as education, employment, projects, skills, or personal information.
_Avoid_: Module, tab, section type

**Entry**:
A repeatable resume item within a section, such as one education experience or one employment experience.
_Avoid_: Block

**Personal Information Section**:
The non-repeatable section that stores the candidate's core contact and identity details.
_Avoid_: Header, profile block

**Template**:
A presentation layout that renders the same resume content in a particular visual structure.
_Avoid_: Resume type, resume content

## Relationships

- An **Application Resume** contains one or more **Sections**
- An **Application Resume** has one **Section Order**
- Every **Application Resume** has one **Personal Information Section**
- Each **Section** appears at most once within an **Application Resume**
- A repeatable **Section** contains zero or more **Entries**
- The **Entries** within a repeatable **Section** have an order
- The **Personal Information Section** is a **Section** with no **Entries**
- The **Personal Information Section** always appears before every repeatable **Section**
- A **Template** renders one **Application Resume**
- A **Job Application** contains one **Application Resume**
- A **Job Application** references one **Job Description**
- A **Job Application** may include one **Evaluation Report**
- A **Job Application** may include one **Chat Session**
- An **Application Resume** is tailored against one **Job Description**
- An **Application Resume** has one **Resume Language**
- An **Application Resume** may be derived from an **Uploaded Resume**
- An **Application Resume** may also be created without an **Uploaded Resume**
- An **Exported Resume** is generated from one **Application Resume** and one **Template**
- A **Chat Session** is attached to one **Application Resume**
- An **Evaluation Report** is derived from one **Application Resume** and one **Job Description**
- An **Evaluation Report** may contain one or more **Suggestions**
- Section labels follow the **Resume Language**

## Example dialogue

> **Dev:** "When a user adds another school record under education, are they adding a new **Entry**?"
> **Domain expert:** "Yes — education contains multiple **Entries**, and each one is a distinct education experience."

## Flagged ambiguities

- `block` was being used to mean both a resume content item and its rendered UI unit — resolved: the domain term is **Entry**; `block` is implementation language only.
- `personalInfo` looked like a special case outside the section model — resolved: it is a **Section**, but a non-repeatable one.
- `template` could be mistaken for part of the resume content — resolved: a **Template** is presentation, not content.
- template selection is not yet a first-class business concept — resolved: keep **Template** in the glossary, but do not model **Selected Template** until it enters the product flow.
- `resume` could be mistaken for a reusable master CV — resolved: this context's canonical term is **Application Resume**, which is bound to one **Job Description**.
- `JD` appears in conversation and a few code paths — resolved: the canonical term is **Job Description**.
- `Job Description` is not read-only imported input — resolved: it can be updated within a **Job Application**, and changing it invalidates the current **Evaluation Report**.
- there could have been three different language concepts in the system — resolved: keep only **UI Language** and **Resume Language**; section label language is not separate and follows **Resume Language**.
- `Resume Language` might be mistaken as freely switchable during editing — resolved: normal editing keeps one **Resume Language**; full-language conversion would be a separate future capability.
- `uploaded resume` and editable resume could be conflated — resolved: **Uploaded Resume** is the source file; **Application Resume** is the editable content bound to one **Job Description**.
- `Uploaded Resume` could be mistaken for a reusable library asset — resolved: it belongs to the context of one **Job Application** in the current model.
- `draft resume` and `persisted/saved resume` appear in implementation language — resolved: they describe states of an **Application Resume**, not separate domain objects.
- `evaluation report` could be mistaken for part of the editable resume — resolved: it is derived analysis, not resume content.
- old evaluation reports are not first-class domain objects — resolved: only the current **Evaluation Report** matters; regenerating it overwrites the prior one.
- exported PDF or print output could be mistaken for the editable resume — resolved: an **Exported Resume** is a generated artifact, not the resume source of truth.
- code currently models chat sessions as plural lists — resolved in domain language: each **Application Resume** should have exactly one **Chat Session**.
- thumbnails and other preview assets exist in code — resolved: they are presentation artifacts and do not belong in the core glossary.
- `optimized_resume_url` exists in storage fields — resolved: do not model **Optimized Resume** as a domain concept unless the product starts using it as a first-class object.
- `suggestion` is currently overloaded to cover both assessment findings and improvement guidance — resolved: keep **Suggestion** as the temporary umbrella term until **Evaluation Report** is remodeled.
- code currently carries a generated `sectionId` field inside section data — resolved: this is implementation language, not a separate domain concept from **Section**.
- `title` is stored on section data in code — resolved: section titles are display labels, not core domain concepts.
- `education` and `skills` are currently default-created sections in code — resolved: treat them as startup defaults, not universally required domain sections.
- an applied change to the resume was tentatively treated as a domain object — resolved: **Suggestion** belongs to the **Evaluation Report**; applied edits are process language unless the product later introduces first-class edit history.
