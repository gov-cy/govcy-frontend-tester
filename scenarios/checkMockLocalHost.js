import {DSFTesting} from '../dist/govcy-frontend-tester.mjs';
/**
 * 
 * Sample script using Headless Recorder https://chrome.google.com/webstore/detail/headless-recorder/djeegiggegleadkkbgopoonhjimgehda
 * 
 */

(async () => {
   
    let DSFTest = new DSFTesting();
        
    //DEBUG --- overwrite puppeteeer settings to headles browser false
    //DSFTest.puppeteerSettings = { headless: true, args: ['--ignore-certificate-errors'], slowMo: 0 };
    DSFTest.skipLog = false;
    DSFTest.showOnlyErrors = true;
    await DSFTest.startTest('Mock','reports/mock/');

    //-------------------- START TESTS -------------------------
    let pageName = 'root';
    //go to page
    await DSFTest.page.goto('https://localhost:44319/?culture=el-GR', { waitUntil: 'networkidle0', });
    //set the viewport     
    await DSFTest.page.setViewport({ width: 1920, height: 969 });
    await DSFTest.ConsoleEcho(pageName); 
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');


    //-------------------- END TESTS -------------------------
    // await DSFTest.page.close()
    // //FLOW report
    // await DSFTest.reportLighthouseFlow('lighthouseReport.html')
    // console.log(DSFTest.reportJSON);
    // //generate the report
    // await DSFTest.generateReport();
    // //close browser
    // await DSFTest.endTest();
    // process.exit(0);

    //click
    await DSFTest.page.click('#btnApplicationStart');
    //-------------------------------------
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

    //------------------------------------
    //Make one round to fill the memory database with data so we'll get to all selection pages
    //await before run
    await DSFTesting.timeout(5000);
    //email-selection
    //click on radio button
    await DSFTest.page.evaluate(() => {
        document.querySelectorAll('input[name="crbEmail"]')[0].click();
    });
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //await before run
    await DSFTesting.timeout(5000);
    
    let urlValue=await DSFTest.page.url()
    console.log("***** " + urlValue);
    //test if the test goes int mobile selection
    if (urlValue.includes("set-mobile")) {
        //set-mobile
        //type
        await DSFTest.page.focus("input#mobile");
        await DSFTest.page.type("input#mobile","99123456", { delay: 100 });
        //click
        await DSFTest.page.click('button.govcy-btn-primary');
        //await before run
        await DSFTesting.timeout(5000);
        //review-page
        //click
        await DSFTest.page.click('button.govcy-btn-primary');
    }
    
    //await before run
    await DSFTesting.timeout(5000);
    //go to page
    await DSFTest.page.goto('https://localhost:44319/Account/LogOut', { waitUntil: 'networkidle0', });
    //await before run
    await DSFTesting.timeout(5000);
    //go to page
    await DSFTest.page.goto('https://localhost:44319/', { waitUntil: 'networkidle0', });
    //await before run
    await DSFTesting.timeout(5000);
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //await before run
    await DSFTesting.timeout(5000);
    //type
    await DSFTest.page.focus('#Input_Username');
    await DSFTest.page.type('#Input_Username',process.env.MOCK_USERNAME, { delay: 100 });

    //type
    await DSFTest.page.focus('#Input_Password');
    await DSFTest.page.type('#Input_Password',process.env.MOCK_PASS, { delay: 100 });

    //click
    await DSFTest.page.click('button[name="Input.Button"]');
    await DSFTesting.timeout(5000);
    
    //-------------------------------------
    pageName='email-selection';
    await DSFTest.ConsoleEcho(pageName); 
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el');
    //-------------------------------------
    pageName='email-selection-error';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',true);
    //-------------------------------------
    pageName='set-email';
    await DSFTest.ConsoleEcho(pageName); 
    //click on radio button
    await DSFTest.page.evaluate(() => {
        document.querySelectorAll('input[name="crbEmail"]')[1].click();
    });
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);
    //-------------------------------------
    pageName='set-email-error';
    await DSFTest.ConsoleEcho(pageName); 
    //type
    await DSFTest.page.focus("input#email");
    await DSFTest.page.type("input#email","", { delay: 100 });
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',true);
    //-------------------------------------
    pageName='mobile-selection';
    await DSFTest.ConsoleEcho(pageName); 
    //type
    await DSFTest.page.focus("input#email");
    await DSFTest.page.type("input#email","test@test.com", { delay: 100 });
    
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);
    //-------------------------------------
    pageName='mobile-selection-error';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',true);
    //-------------------------------------
    pageName='set-mobile';
    await DSFTest.ConsoleEcho(pageName); 
    //click on radio button
    await DSFTest.page.evaluate(() => {
        document.querySelectorAll('input[name="crbMobile"]')[1].click();
    });
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);
    //-------------------------------------
    pageName='set-mobile-error';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',true);
    //-------------------------------------
    pageName='review-page';
    await DSFTest.ConsoleEcho(pageName); 
    //type
    await DSFTest.page.focus("input#mobile");
    await DSFTest.page.type("input#mobile","99123456", { delay: 100 });
    
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);
    //-------------------------------------
    pageName='mobile-selection-from-review';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('a[href="/mobile-selection/true"]');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);
    //-------------------------------------
    pageName='review-page-after-change';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);

    //-------------------------------------
    pageName='application-response';
    await DSFTest.ConsoleEcho(pageName); 
    //click
    await DSFTest.page.click('button.govcy-btn-primary');
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);

    //-------------------------------------
    pageName='privacy-statement';
    await DSFTest.ConsoleEcho(pageName); 
    //go to page
    await DSFTest.page.goto('https://localhost:44319/privacy-statement', { waitUntil: 'networkidle0', });
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);

    //-------------------------------------
    pageName='cookie-policy';
    await DSFTest.ConsoleEcho(pageName); 
    //go to page
    await DSFTest.page.goto('https://localhost:44319/cookie-policy', { waitUntil: 'networkidle0', });
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);

    //-------------------------------------
    pageName='accessibility-statement';
    await DSFTest.ConsoleEcho(pageName); 
    //go to page
    await DSFTest.page.goto('https://localhost:44319/accessibility-statement', { waitUntil: 'networkidle0', });
    //run the batch of tests and reports fo this page 
    await DSFTest.DSFStandardPageTest(pageName,'el',false);

    await DSFTest.page.close()
    
    //-------------------- END TESTS -------------------------
//process.exit(0);
    //FLOW report
    await DSFTest.reportLighthouseFlow('report.html')
    console.log(DSFTest.reportJSON);
    //generate the report
    await DSFTest.generateReport();
    //close browser
    await DSFTest.endTest();
})();
