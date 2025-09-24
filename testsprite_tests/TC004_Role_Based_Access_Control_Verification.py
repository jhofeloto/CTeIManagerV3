import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Click on 'Ingresar' button to start login as ADMIN
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill email and password fields and submit login form for ADMIN
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin@demo.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin123')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Logout ADMIN and login as INVESTIGATOR
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/nav/div/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Ingresar' button to open login modal for INVESTIGATOR login.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill email and password fields and submit login form for INVESTIGATOR
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('investigator@demo.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('investigator123')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Wait for login and dashboard load
        await page.wait_for_timeout(3000)

        # Verify ADMIN can access admin features
        admin_features = [
            page.locator('text=Panel de Administración'),
            page.locator('text=Gestionar Usuarios'),
            page.locator('text=ADMIN'),
            page.locator('text=admin@demo.com')
        ]

        admin_access_confirmed = False
        for feature in admin_features:
            try:
                await feature.wait_for(timeout=2000)
                admin_access_confirmed = True
                break
            except:
                continue

        # Logout and login as INVESTIGATOR
        try:
            logout_btn = page.locator('button').filter(has_text='Cerrar Sesión')
            await logout_btn.click()
            await page.wait_for_timeout(1000)
        except:
            pass

        # Click login again for INVESTIGATOR
        try:
            login_btn = page.locator('button').filter(has_text='Ingresar')
            await login_btn.click()
            await page.wait_for_timeout(1000)
        except:
            pass

        # Login as INVESTIGATOR
        try:
            email_input = page.locator('input[type="email"]')
            await email_input.fill('investigator@demo.com')

            password_input = page.locator('input[type="password"]')
            await password_input.fill('investigator123')

            submit_btn = page.locator('button').filter(has_text='Ingresar')
            await submit_btn.click()
            await page.wait_for_timeout(2000)
        except:
            pass

        # Verify INVESTIGATOR cannot access admin features but can access their own features
        investigator_features = [
            page.locator('text=Mis Proyectos'),
            page.locator('text=INVESTIGATOR'),
            page.locator('text=investigator@demo.com')
        ]

        investigator_access_confirmed = False
        for feature in investigator_features:
            try:
                await feature.wait_for(timeout=2000)
                investigator_access_confirmed = True
                break
            except:
                continue

        # Verify admin features are not accessible to INVESTIGATOR
        admin_restricted = True
        for feature in admin_features:
            try:
                await feature.wait_for(timeout=1000)
                admin_restricted = False  # If we find admin features, access control failed
                break
            except:
                continue

        # Assert role-based access control is working
        assert admin_access_confirmed, 'ADMIN user could not access admin features'
        assert investigator_access_confirmed, 'INVESTIGATOR user could not access their features'
        assert admin_restricted, 'INVESTIGATOR user could access admin features - security breach!'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    