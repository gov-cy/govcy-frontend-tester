# Changelog
 
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.2.1]- 2024-12-09
### Fixed
- Small bug fixes that caused the execution to stop on errors

## [v1.2.0]- 2024-12-09
### Changed
- Updated `serviceDesignSystemVersion` to 3.0.0

## [v1.1.13]- 2024-12-09
### Fixed
- Updated npm packages to fix CVE-2024-47764

## [v1.1.12]- 2024-07-24
### Fixed
- Updated npm packages to fix `ws` vulnerability (https://github.com/advisories/GHSA-3h5v-q93c-6h6q)

## [v1.1.11]- 2024-07-24
### Fixed
- Updated npm packages to fix security concerns

## [v1.1.10]- 2024-05-02
### Fixed
- Updated npm packages to fix security concerns

## [v1.1.9]- 2024-01-27
## Added
- Added `pa11yHideElements` option

### Changed
- Sticky side menu on report

### Fixed
- Fixed filename for screenshots and head files when url has the `/` character

## [v1.1.8]- 2023-11-07
### Fixed
- Fixed semver vulnerability Upgrade @babel/traverse

## [v1.1.7]- 2023-07-10
### Fixed
- Fixed semver vulnerability by overwriting "semver": ">=7.5.2"

## [v1.1.5]- 2023-04-30
### Added
- Added `DSFTest.DSFCheckLevel` in configuration to filter which DSF checks to perform with the `DSFStandardPageTest` function based on check level.

## [v1.1.3] , [v1.1.4]- 2023-04-29
### Changed
- Fixed github workflow to publish on npm.

## [v1.1.2] - 2023-04-29
### Changed
- Update README.MD. 
- Update `serviceDesignSystemVersion` to 2.1.1

## [v1.1.1] - 2023-01-28
### Changed
- Update README.MD.

## [v1.0.4] - 2023-01-28
### Changed
- Update the github workflow also publish on npm.

## [v1.0.3] - 2023-01-28
### Changed
- Update `README.md`

## [v1.0.2] - 2023-01-27
### Added
- `CHANGELOG.md` added 

## [v1.1.0] - 2023-01-28
### Added
- `ignoreChecks` option on `DSFStandardPageTest`.

### Fixed 
- Fixed bug where `performDSFChecks=false` was not working 