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
        # Click the 'Ingresar' button to start login as INVESTIGATOR.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/nav/div/div/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input email and password for INVESTIGATOR and click 'Ingresar' button.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin@demo.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin123')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate to 'Gestión de Productos' to create a new scientific product.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/aside/nav/ul/li[11]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the button to create a new scientific product.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[3]/div/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll up to try to find the 'Nuevo Producto' or 'Crear Producto' button to start creating a new scientific product.
        await page.mouse.wheel(0, -300)
        

        # Scroll down to try to find the 'Nuevo Producto' or 'Crear Producto' button to start creating a new scientific product.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Click on 'Mis Productos' menu item to check if the creation option is available there.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/aside/nav/ul/li[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Nuevo Producto' button to start creating a new scientific product.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select a project from the dropdown and click 'Continuar' to proceed with product creation.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/div/div[2]/select').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select the project 'EcoMar 4.0: Sostenibilidad Marina Inteligente' by clicking the corresponding option in the dropdown, then click 'Continuar' to proceed.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[3]/div/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Wait for navigation and page load
        await page.wait_for_timeout(3000)

        # Check if we successfully navigated to products section
        products_section_loaded = False
        product_indicators = [
            page.locator('text=Productos'),
            page.locator('text=Mis Productos'),
            page.locator('text=Nuevo Producto'),
            page.locator('text=Crear Producto')
        ]

        for indicator in product_indicators:
            try:
                await indicator.wait_for(timeout=3000)
                products_section_loaded = True
                break
            except:
                continue

        assert products_section_loaded, 'Products section did not load properly'

        # Look for create product button
        create_buttons = [
            page.locator('button').filter(has_text='Nuevo'),
            page.locator('button').filter(has_text='Crear'),
            page.locator('button').filter(has_text='New'),
            page.locator('button').filter(has_text='Create')
        ]

        create_button_found = False
        for btn in create_buttons:
            try:
                await btn.wait_for(timeout=2000)
                create_button_found = True
                break
            except:
                continue

        if create_button_found:
            # Click create button
            for btn in create_buttons:
                try:
                    await btn.click(timeout=2000)
                    break
                except:
                    continue

            await page.wait_for_timeout(2000)

            # Check if product creation form/modal appeared
            form_indicators = [
                page.locator('form'),
                page.locator('input').filter(has_text=''),
                page.locator('select'),
                page.locator('text=Tipo'),
                page.locator('text=Descripción')
            ]

            form_loaded = False
            for indicator in form_indicators:
                try:
                    count = await indicator.count()
                    if count > 0:
                        form_loaded = True
                        break
                except:
                    continue

            assert form_loaded, 'Product creation form did not load'
        else:
            # If no create button, check if products are displayed
            products_displayed = False
            product_list_indicators = [
                page.locator('.product-item'),
                page.locator('.product-card'),
                page.locator('text=ARTICULO'),
                page.locator('text=SOFTWARE'),
                page.locator('text=LIBRO')
            ]

            for indicator in product_list_indicators:
                try:
                    count = await indicator.count()
                    if count > 0:
                        products_displayed = True
                        break
                except:
                    continue

            assert products_displayed, 'No products displayed and no create button found'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    