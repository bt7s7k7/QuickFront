# QuickFront

Package to quickly hack together a frontend for your server. It is only meant to be used as a dev placeholder or for small projects where the performance and user friendliness of your frontend are not important.

This package includes 

## Usage 

Serve the included files from your backend or use an npm CDN like unpkg.

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://www.unpkg.com/quick-front@1.0.0/dist/assets/main.css">
    <script type="module" src="https://www.unpkg.com/quick-front@1.0.0/dist/assets/quick-front.js"></script>
</head>
<body>
    <div form-type="Object_t" class="p-4"></div>

    <ul>
        <template for="$i in [...range(10)]">
            <li>$i</li>
        </template>
    </ul>

    <script>
        function init() {
            STATE.value = { value: 0 }

            const Object_t = Type.object({
                value: Type.number
            })

            startApp({ Object_t })
        }
    </script>
</body>
</html>
```
