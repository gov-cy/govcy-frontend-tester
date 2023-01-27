import { expect } from 'chai';
import fs from 'fs';
import httpServer from 'http-server';
import {DSFTesting} from '../dist/govcy-frontend-tester.mjs';



describe('Testing DSFTesting class', () => {
    let dsfTesting;
    dsfTesting = new DSFTesting();
    dsfTesting.serviceDesignSystemVersion = '1.3.2';
    let correctDesignSystemVersion = dsfTesting.serviceDesignSystemVersion ;
    it('1. `RepeatStr` should repeat the string correctly', async() => {
        const count = 5;
        const pattern = '*';
        const expected = '*****';
        const result = await dsfTesting.RepeatStr(count, pattern);
        expect(result).to.equal(expected);
    });
    it('2. `startTest` should set testName and reportPath', async () => {
        await dsfTesting.startTest('testName', 'reports/');
        expect(dsfTesting.testName).to.equal('testName');
        expect(dsfTesting.reportPath).to.equal('reports/');
    });
    it('3. `timeout` should wait for the specified amount of time before resolving', async () => {
        const startTime = Date.now();
        await DSFTesting.timeout(1000);
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        expect(elapsedTime).to.be.at.least(1000);
    });
    it('4.1 `rgb2hex` should convert a RGB color value to a hex color value', () => {
        const rgbColor = 'rgb(255, 99, 71)';
        const expectedHexColor = '#ff6347';
        const hexColor = DSFTesting.rgb2hex(rgbColor);
        expect(hexColor).to.equal(expectedHexColor);
    });

    it('4.2. `rgb2hex` should return "#ffffff" if an invalid RGB color is passed', () => {
        const invalidRgbColor = 'rgb(255, 99';
        const expectedHexColor = '#ffffff';
        const hexColor = DSFTesting.rgb2hex(invalidRgbColor);
        expect(hexColor).to.equal(expectedHexColor);
    });
    
    let server;
    //------ Start HTTP SERVER
    before(async function() {
        server = httpServer.createServer({root: './test_site/v1'});
        await server.listen(3000);
    });

    it('5.1 `DSFStandardPageTest` should run real test on a real page', async () => {
        //-------------------- START TESTS -------------------------
        const pageName = 'root';
        //go to page
        await dsfTesting.page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0', });
        //run the batch of tests and reports fo this page 
        await dsfTesting.DSFStandardPageTest(pageName,'el');
        const reportJSON = dsfTesting.reportJSON;
        expect(reportJSON.pages[0].id).to.equal(pageName);
    });
    it('5.2 `DSFStandardPageTest` with version changed', async () => {
        const pageName = 'version100';
        dsfTesting.serviceDesignSystemVersion = '100.0.0';
        //go to page
        await dsfTesting.page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0', });
        //run the batch of tests and reports fo this page 
        await dsfTesting.DSFStandardPageTest(pageName,'el');
        const reportJSON = dsfTesting.reportJSON;
        expect(reportJSON.pages[1].id).to.equal(pageName);
        dsfTesting.serviceDesignSystemVersion = correctDesignSystemVersion;
    });
    it('5.2.1 `reportLighthouseFlow` should run and add the path to the JSON', async () => {
        const path = 'lighthouse-report.pdf';
        await dsfTesting.reportLighthouseFlow(path);
        expect(dsfTesting.reportJSON.lighthouse).to.equal(path);
      });
    it('5.3 `DSFStandardPageTest` with perform options in false', async () => {
        const pageName = 'perform';
        dsfTesting.performHeadSection = false;
        dsfTesting.performLighthouse = false;
        dsfTesting.performDSFChecks = false;
        dsfTesting.performPa11yChecks = false;
        //go to page
        await dsfTesting.page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0', });
        //run the batch of tests and reports fo this page 
        await dsfTesting.DSFStandardPageTest(pageName,'el');
        const reportJSON = dsfTesting.reportJSON;
        expect(reportJSON.pages[2].id).to.equal(pageName);
        let checkObject = reportJSON.pages[2].checks.find(object => object.type === "head");
        expect(checkObject).to.equal(undefined);
        checkObject = reportJSON.pages[2].checks.find(object => object.type === "4.3.1.viewport");
        expect(checkObject).to.equal(undefined);
        checkObject = reportJSON.pages[2].checks.find(object => object.type === "pa11y.issues");
        expect(checkObject).to.equal(undefined);
        dsfTesting.performHeadSection = true;
        dsfTesting.performLighthouse = true;
        dsfTesting.performDSFChecks = true;
        dsfTesting.performPa11yChecks = true;
    });

    
    it('6.1 `validateUrl` should return true if the URL is reachable', async () => {
        const isValid = await dsfTesting.validateUrl('http://localhost:3000/index.html');
        expect(isValid).to.be.true;
    });
    it('6.2 `validateUrl` should return false if the URL is not reachable', async () => {
        const isValid = await dsfTesting.validateUrl('https://not-a-real-website83636363.com');
        expect(isValid).to.be.false;
    });
    //------ Stop HTTP server
    after(async function() {
        await server.close();
    });
    
    it('7.1 `doScreenshot` should take a screenshot and save it in', async () => {
        const screenshotPath = dsfTesting.reportPath + 'root.1200.png';
        expect(fs.existsSync(screenshotPath)).to.be.true;
    });
    it('7.2 `doScreenshot` should add the screenshot to the report JSON', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.key === "root.1200");
        expect(checkObject).to.deep.equal({
            'type': 'screenshoot',
            'key': 'root.1200',
            'value': 'root.1200.png',
            'isText': false,
            'isFile': true,
            'isScreenshoot': true,
            'isPa11y': false,
            'hasCondition': false,
            'condition': undefined,
            'hasSelector': false,
            'HTMLselector': undefined,
            'hasAttribute': false,
            'attribute': undefined
        });
    });
    it('8.1 `getHeadSection` should save the head section in a text file', async () => {
        const screenshotPath = dsfTesting.reportPath + 'root.head.txt';
        expect(fs.existsSync(screenshotPath)).to.be.true;
    });
    it('8.2 `getHeadSection` should run and and save it to the report json', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.key === "root.head");
        expect(checkObject).to.deep.equal({
            'type': 'head',
            'key': 'root.head',
            'value': 'root.head.txt',
            'isText': false,
            'isFile': true,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': false,
            'condition': undefined,
            'hasSelector': false,
            'HTMLselector': undefined,
            'hasAttribute': false,
            'attribute': undefined
        });
    });
    it('9.1 `DSFStandardPageTest` at least one check run of testType : `elementAttributeTest`', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.type === "4.3.1.viewport");
        expect(checkObject).to.deep.equal({
            'type': '4.3.1.viewport',
            'key': 'root.4.3.1.viewport',
            'value': 'width=device-width, initial-scale=1',
            'isText': true,
            'isFile': false,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': true,
            'condition': true,
            'hasSelector': true,
            'HTMLselector': 'head > meta[name="viewport"]',
            'hasAttribute': true,
            'attribute': 'content'
        });
    });
    it('9.2 `DSFStandardPageTest` at least one check run of testType : `pageTitleTest`', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.type === "4.3.2.title");
        expect(checkObject).to.deep.equal({
            'type': "4.3.2.title",
            'key': 'root.4.3.2.title',
            'value': 'Where do you live? - Sample service - gov.cy',
            'isText': true,
            'isFile': false,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': true,
            'condition': true,
            'hasSelector': false,
            'HTMLselector': undefined,
            'hasAttribute': false,
            'attribute': undefined
        });
    });
    it('9.3 `DSFStandardPageTest` at least one check run of testType : `countElementsTest`', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.type === "4.3.2.description.count");
        expect(checkObject).to.deep.equal({
            'type': "4.3.2.description.count",
            'key': 'root4.3.2.description.count',
            'value': 1,
            'isText': true,
            'isFile': false,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': true,
            'condition': true,
            'hasSelector': true,
            'HTMLselector': 'head > meta[name="description"]',
            'hasAttribute': false,
            'attribute': undefined
        });
    });
    it('9.4 `DSFStandardPageTest` at least one check run of testType : `computedStyleTest`', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.type === "4.3.7.width.v1");
        expect(checkObject).to.deep.equal({
            'type': "4.3.7.width.v1",
            'key': 'root4.3.7.width.v1',
            'value': '1280px',
            'isText': true,
            'isFile': false,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': true,
            'condition': true,
            'hasSelector': true,
            'HTMLselector': '#mainContainer',
            'hasAttribute': true,
            'attribute': "width"
        });
    });
    it('9.5 `DSFStandardPageTest` at least one check run of testType : `randomComputedStyleTest`', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.type === "4.3.6.h1.color.v1");
        expect(checkObject).to.deep.equal({
            'type': "4.3.6.h1.color.v1",
            'key': 'root4.3.6.h1.color.v1',
            'value': 'rgb(39, 37, 37)',
            'isText': true,
            'isFile': false,
            'isScreenshoot': false,
            'isPa11y': false,
            'hasCondition': true,
            'condition': true,
            'hasSelector': true,
            'HTMLselector': 'main h1',
            'hasAttribute': true,
            'attribute': "color"
        });
    });
    
    it('10 `DSFStandardPageTest` with version  changed filters checks', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[1].checks.find(object => object.type === "4.3.6.h1.color.v1");
        expect(checkObject).to.equal(undefined);
    });
    it('11 `doPa11y` should run and and save it to the report json', async () => {
        const reportJSON = dsfTesting.reportJSON;
        const checkObject = reportJSON.pages[0].checks.find(object => object.key === "root.pa11y");
        expect(checkObject.type).to.equal( 'pa11y.issues');
        expect(checkObject.key).to.equal( 'root.pa11y');
        expect(checkObject.isPa11y).to.equal( true);
        expect(checkObject.value).to.be.a( 'array');
    });
    it('xx. `generateReport` should generate a report file', async () => {
        //console.log(JSON.stringify(dsfTesting.reportJSON,null, 3));
        fs.writeFileSync(dsfTesting.reportPath + 'reportJSON.txt', JSON.stringify(dsfTesting.reportJSON,null, 3));
        await dsfTesting.generateReport();
        let reportFileExists = fs.existsSync(dsfTesting.reportPath + 'index.html');
        expect(reportFileExists).to.be.true;
    });
    it('xx. should close the browser', async () => {
        await dsfTesting.endTest();
        expect(dsfTesting.browser.isConnected()).to.equal(false);
    });
});
