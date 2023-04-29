![npm (scoped)](https://img.shields.io/npm/v/@gov-cy/govcy-frontend-tester) ![GitHub](https://img.shields.io/github/license/gov-cy/govcy-frontend-tester) [![](https://github.com/gov-cy/govcy-frontend-tester/actions/workflows/unit-test.yml/badge.svg)](https://github.com/gov-cy/govcy-frontend-tester/actions/workflows/unit-test.yml) [![](https://github.com/gov-cy/govcy-frontend-tester/actions/workflows/tag-and-publish-on-version-change.yml/badge.svg)](https://github.com/gov-cy/govcy-frontend-tester/actions/workflows/tag-and-publish-on-version-change.yml)

`govcy-frontend-tester` is an npm package that can be used to perform front end tests in terms of the accessibility and design guidelines established by the Digital Services Factory (DSF) Cyprus. It is designed to help developers and QAs test their online services based on the [gov.cy design system](https://gov-cy.github.io/govcy-design-system-docs/) and speed up the assurance process.

Note that this package does not substitute the DSF assurance process and it does not perform all possible checks required by DSF.  

The package currently can perform tests up to **version 2.1.1** of the design system.

## Features

`govcy-frontend-tester` uses the [Puppeteer](https://pptr.dev/) framework to navigate through online services, perform predefined tests and generate HTML reports. Among other it can:

- Interact and navigate with online services.
- Perform front end tests to assess compliance with the "gov.cy design system".
    - Test can be performed on a specific version of the design system.
- Take screenshots in different resolutions.
- Perform accessibility checks using PA11Y.
- Creates a lighthouse report for performance, accessibility, best practices and SEO.
- Generate human readable report with the test results.

## Prerequisites 

- You need to have [Node.js](https://nodejs.org/en/) installed. The package has been tested on node version 14. 

## Installation

To install `govcy-frontend-tester`, run the following command:

```bash
npm install @gov-cy/govcy-frontend-tester
```

## Usage

To use `govcy-frontend-tester`, you will need to script your test scenarios. This can be done using the [Puppeteer](https://pptr.dev/) framework functions with the provided `page` instance.

In this documentation we will look at how you can create a test scenario for a mock service.

To create a script with a scenario, create a `js` file (we recommend creating the files under a `./scenarios/` folder). In our example we are creating the following file under `./scenarios/checkMockLocalHost.js`.

To use the `govcy-frontend-tester` methods, you must first import the package with the following code:

```js
import { DSFTesting } from '@gov-cy/govcy-frontend-tester' 
```

The scenario needs to be run on an async function. So include your scenario code as follows:

```js
(async () => {
    //... your scenarios here
})();

```

Start using the package you need to create an instance as follows: 

```js
    let DSFTest = new DSFTesting();
```

You can change any of the default configuration values before starting a test (before calling the `startTest` function). For example:

```js
    // set `headless:false` to open a physical instance of chrome
    DSFTest.puppeteerSettings = { headless: false, args: ['--ignore-certificate-errors'], slowMo: 0 };
    // set `skipLog` to false for the package to write details in the console.log (for debugging purposes)
    DSFTest.skipLog = false;
    // set `showOnlyErrors = false` to show all the results in the report (not only the checks that failed)
    DSFTest.showOnlyErrors = false;
    // set on which version of the design system the tested pages are build.
    DSFTest.serviceDesignSystemVersion = `1.1.2`
```

Start your test with the `startTest` method as follows:

```js
    // start test with test name 'Mock' and report folder 'reports/mock/'
    await DSFTest.startTest('Mock','reports/mock/');
```

Then you can use the puppeteer's page instance `DSFTest.page` to interact with web pages and the `DSFTest.DSFStandardPageTest` method to perform the checks. For example:

```js
    let pageName = 'root';
    //go to page
    await DSFTest.page.goto('https://localhost:44319/?culture=el-GR', { waitUntil: 'networkidle0', });
    //set the viewport     
    await DSFTest.page.setViewport({ width: 1920, height: 969 });
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');

```

You can use puppeteer functions to interact with the page and run checks on other pages (or page states) as follows:

```js
    pageName='email-selection';
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');

```

After you finish scripting the scenario you can generate the report using the `generateReport` method. You can also use the `reportLighthouseFlow` to generate the lighthouse report as well as follows:

```js
    //lighthouse flow report
    await DSFTest.reportLighthouseFlow('report.html')
    //generate the report
    await DSFTest.generateReport();
```

Remember to run the `endTest` as follows:

```js
    //close browser
    await DSFTest.endTest();
```

Once your test scenarios are scripted, you can use the following command to run govcy-frontend-tester:

```bash 
node ./scenarios/checkMockLocalHost.js
```

The command will execute your test scenarios and generate a report in the `./report` folder.

### Example scenario script

Here is an example scenario script testing a web app on localhost. The script does the following:
-  Load the page at `https://localhost:44319/?culture=el-GR` makes performs the `DSFStandardPageTest` on the start page
-  Clicks the `button.govcy-btn-primary` button and logs in on a mock login page
-  After login performs the `DSFStandardPageTest` on the email-selection page.

NOTE:
The example script uses some environmental variables for test username and password used in the respected scenarios. Make sure you set the following:

```shell
#on powershell
$env:MOCK_USERNAME = '<username>'
$env:MOCK_PASS = '<password>'

#on windows
set MOCK_USERNAME=<username> 
set MOCK_PASS=<password> 

# On Unix 
export MOCK_USERNAME=<username>
export MOCK_PASS=<password>
```

Here is the sample script:

```js
import { DSFTesting } from '@gov-cy/govcy-frontend-tester'


(async () => {
     let DSFTest = new DSFTesting();
    await DSFTest.startTest('Mock','reports/mock/');
    //-------------------- START TESTS -------------------------
    let pageName = 'root';
    //go to page
    await DSFTest.page.goto('https://localhost:44319/?culture=el-GR', { waitUntil: 'networkidle0', });
    //set the viewport     
    await DSFTest.page.setViewport({ width: 1920, height: 969 });
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //--------Mock Login -----------------------------
    //await before run
    await DSFTesting.timeout(5000);
    console.log('********** Mock Login ***');
    //type
    await DSFTest.page.focus('#Input_Username');
    await DSFTest.page.type('#Input_Username',process.env.MOCK_USERNAME, { delay: 100 });

    //type
    await DSFTest.page.focus('#Input_Password');
    await DSFTest.page.type('#Input_Password',process.env.MOCK_PASS, { delay: 100 });

    //click
    await DSFTest.page.click('button[name="Input.Button"]');

     //-------Email selection ------------------------------
     pageName='email-selection';
    await DSFTest.ConsoleEcho(pageName); 
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');

    await DSFTest.page.close()
    //-------------------- END TESTS -------------------------
    //FLOW report
    await DSFTest.reportLighthouseFlow('report.html');
    //generate the report
    await DSFTest.generateReport();
    //close browser
    await DSFTest.endTest();
})();

```

### Examples interacting with a webpage with puppeteer

Here are some basic stuff you can do with puppeteer on web pages. Note that most of these functions work by defining the elements selector. 

- **Click**
```js
await DSFTest.page.click('button.govcy-btn-primary');
```
- **Type**
```js
//type
await DSFTest.page.focus("input#mobile");
await DSFTest.page.type("input#mobile","99123456", { delay: 100 });
```
- **Click on a radio button**
```js
//click the second option on the radio button
await DSFTest.page.evaluate(() => {
    document.querySelectorAll('input[name="crbEmail"]')[1].click();
});
```
- **Select**
```js
//select option with value 7-101204
await DSFTest.page.click('#ViewModel_SelectedAddress');
await DSFTest.page.select('#ViewModel_SelectedAddress', '7-101204');
```

Checkout what you can do with puppeteer at https://pptr.dev/.

### DSFTesting class
The package main class used to interact with webpages through puppeteer and perform the tests. Check out the [class documentation](docs/govcy-frontend-tester.md) for more details. 

#### DSFStandardPageTest

This is the method that is used to perform the checks on a page. The method accepts the following parameters:

```js
/**
 * @param {string} pageName The page name  
 * @param {string} lang Lang expected in html element  
 * @param {boolean} isError if the page in an errors state (uses the error message and error summary component)  
 * @param {Array} [ignoreChecks=[]] an array of stings for the ids of the checks to ignore   
 */ 
```

If you wish to ignore some checks for a specific page you can call the method using the `ignoreChecks` as follows:

```js

await dsfTesting.DSFStandardPageTest("Page title",'el',false
    ,["4.3.5.meta.favicon.apple.exists", "4.3.5.meta.favicon.72x72.exists"]);
```

With the above code, the checks for "4.3.5.meta.favicon.apple.exists" and "4.3.5.meta.favicon.72x72.exists" will be ignored.

Also note that the following configurations will affect which tests will be made by the method (more details below):

- `serviceDesignSystemVersion`
- `performHeadSection`
- `performLighthouse`
- `performDSFChecks`
- `performPa11yChecks`

### Configurations
You can change the configuration values to your needs before starting a test . Here are some example of overwriting the configuration values (for more details check out [class documentation](docs/govcy-frontend-tester.md)). 

```js
/**
 * Whether to show only errors in the report or show all the checks. 
 * Default value = false
 */
DSFTest.showOnlyErrors=false; 
/**
 * Default puppeteer Settings
 * Default value = { headless: true, args: ['--ignore-certificate-errors'], slowMo: 0 }
 */
DSFTest.puppeteerSettings = { headless: true, args: ['--ignore-certificate-errors'], slowMo: 0 };
/**
 * 
 * Default lighthouse flow settings
 */
DSFTest.lighthouseFlowConfigContext = {
    screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
    },
    formFactor: "desktop",
};
/**
 * Default pa11y settings
 * Default value = {standard: 'WCAG2AA',ignoreUrl: true,wait: 10000} 
 */
DSFTest.pa11ySettings = {standard: 'WCAG2AA',ignoreUrl: true,wait: 10000};
/**
 * The path of the reports. Can be used to set the folder where the reports are saved. 
 * Note: the folder needs to exist.
 */
DSFTest.reportPath="";
/**
 * Indicates whether to use an incognito browser content
 * Default value =  true
 */
DSFTest.isIncognito = true;
/**
 * The widths to take screenshoots
 * Default value = [1200,800,360]
 */
DSFTest.screenshotWidths = [1200,800,360];
/**
 * Use this flag to skip testing
 */
DSFTest.skipLog = true;
/**
 * What version of the design system was the service build on. 
 * This will make sure the correct checks are made 
 */
DSFTest.serviceDesignSystemVersion = `1.3.2`

/**
 * Whether on not to get the head section
 * Default = `true`
 */
DSFTest.performHeadSection = true;

/**
 * Whether on not to perform lighthouse checks
 * Default = `true`
 */
DSFTest.performLighthouse = true;

/**
 * Whether on not to perform the DSF Checks defined under `DSFTestOptions`
 * Default = `true`
 */
DSFTest.performDSFChecks = true;

/**
 * Whether on not to perform the pa11y checks
 * Default = `true`
 */
DSFTest.performPa11yChecks = true;

```

#### Overwriting checks definition
The checks carried out by the `DSFStandardPageTest` method are defined under the `DSFTestOptions.tests` property and they are defined as follows:

```js
'test_type': {
    'selector': '#mainContainer', //DOM selector to be used in the check
    'version' : '1 - 2', //Which versions of the design system this rule applies to. It uses the semver.satisfies as described in https://www.npmjs.com/package/semver
    'attribute':'width', //which attribute of the element to check
    'testType' : 'computedStyleTest', // the type of test to perform 
    'onError' : false, // if this should be fired on error only
    'resize' : {"width" : 2200, "height" : 3000}, // if there is a need to resize the window 
    'condition':async (value,lang) => {return await value.toLowerCase() == '1280px'} //what condition needs to be satisfied to pass this test
}

```

You can overwrite the way a check is made in your instance before running the tests as follows:

```js

DSFTest.DSFTestOptions[4.3.7.width.v1].selector='#mainContainer';
DSFTest.DSFTestOptions[4.3.7.width.v1].attribute='width';
DSFTest.DSFTestOptions[4.3.7.width.v1].testType='randomComputedStyleTest';
```

The following test types are supported by the package:
- **elementAttributeTest** gets the value of an element's attribute (based on the selector and attribute property) for the current page instance
- **pageTitleTest** gets the page title for the current page instance
- **countElementsTest** counts elements based on the selector property for the current page instance 
- **computedStyleTest** gets the computed style an element's attribute (based on the selector and attribute property) for the current page instance
- **getRandomComputedStyle** gets the property value of a computed style of a random element of the page based on the selector.

### Notes on configurations

- The `serviceDesignSystemVersion` configuration determines what version of the design system was used to build the pages tested, so that the class knows which checks to perform. 
- The folder defined in `reportPath` must exist. 


### Generated Report

The report generated by the `generateReport` will include for each time you run the `DSFStandardPageTest` method in your code.:

- Screenshots for each page in different resolutions.
- Compliance issues with the "gov.cy design system".
- Accessibility violations found by PA11Y.
- Lighthouse report for performance, accessibility, best practices and SEO.

### Generated JSON

The tests results are saved in the `reportJSON` object. Here is an example of the object's structure 

```js 
{
   "testName": "testName", // name of the test
   "lighthouse": "lighthouse-report.pdf", //lighthouse report path
   "pages": [ //adds a new object each time the `DSFStandardPageTest` method is called
      {
         "id": "root",
         "checks": [
            {
               "type": "screenshoot", // a screenshoot
               "key": "root.360",
               "value": "root.360.png",
               "isText": false,
               "isFile": true,
               "isScreenshoot": true,
               "isPa11y": false,
               "hasCondition": false,
               "hasSelector": false,
               "hasAttribute": false
            },
            {
               "type": "head", //the head section of the page
               "key": "root.head",
               "value": "root.head.txt",
               "isText": false,
               "isFile": true,
               "isScreenshoot": false,
               "isPa11y": false,
               "hasCondition": false,
               "hasSelector": false,
               "hasAttribute": false
            },
            {
               "type": "4.3.1.viewport", // example of a test result
               "key": "root.4.3.1.viewport",
               "value": "width=device-width, initial-scale=1",
               "isText": true,
               "isFile": false,
               "isScreenshoot": false,
               "isPa11y": false,
               "hasCondition": true,
               "condition": true,
               "hasSelector": true,
               "HTMLselector": "head > meta[name=\"viewport\"]",
               "hasAttribute": true,
               "attribute": "content"
            },
            {
               "type": "pa11y.issues", //the pa11y accessibility issues 
               "key": "root.pa11y",
               "value": [
                  {
                     "code": "WCAG2AA.Principle1.Guideline1_1.1_1_1.H30.2",
                     "type": "error",
                     "typeCode": 1,
                     "message": "Img element is the only content of the link, but is missing alt text. The alt text should describe the purpose of the link.",
                     "context": "<a href=\"#\" class=\"govcy-logo\"> <img></a>",
                     "selector": "#headerContainer > div > header > a",
                     "runner": "htmlcs",
                     "runnerExtras": {}
                  }
               ],
               "isText": false,
               "isFile": false,
               "isScreenshoot": false,
               "isPa11y": true,
               "hasCondition": true,
               "condition": false,
               "hasSelector": false,
               "hasAttribute": false
            }
         ]
      }
   ],
   "showOnlyErrors": true
}
```

## Note

Please note that govcy-frontend-tester is a tool to assist you in the compliance process and it does not guarantee full compliance with the "gov.cy design system". It's important to manually check and validate the results of the generated report. For more details check out the [gov.cy design system's](https://gov-cy.github.io/govcy-design-system-docs/) website.

## License

govcy-frontend-tester is released under the [MIT License](https://opensource.org/licenses/MIT).

## Contact

If you have any questions or feedback, please feel free to reach out to us at [dsf-admin@dits.dmrid.gov.cy](mailto:dsf-admin@dits.dmrid.gov.cy)

## Todo

- Add more tests
- Add check levels (0 = mandatory, 1 = intermediate, 2 = high )
- Add linters (html, js, css)
- Handle DSF design system known issues.