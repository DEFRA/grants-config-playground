# grants-config-playground

Playground grant configurations used to try configuration shapes before applying them to production grant repos.

## Language

**Playground**
The non-production configuration area used for experimentation and examples.
_Avoid_: Production grant, Live service, Fixture when a full journey is meant

**Slide config**
A playground configuration variant under `slide-config`.
_Avoid_: Page transition, Carousel, UI animation

**Swing config**
A playground configuration variant under `swing-config`.
_Avoid_: Feature flag, Runtime mode, Animation

**Grant configuration**
A versioned set of files that describes a grant journey and related metadata.
_Avoid_: Source code, Runtime state, Test script

**Grant journey**
The user flow rendered from configuration.
_Avoid_: Wizard, Survey, Funnel

**Changeset**
The release note/version marker required for configuration changes.
_Avoid_: Changelog entry when the `.changeset` file is meant, Commit message
