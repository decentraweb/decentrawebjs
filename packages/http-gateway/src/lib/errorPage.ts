export function errorPage(title: string, message: string){
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
              background-color: #504ec9;
              color: #fff;
              font-family: Manrope,sans-serif;
              font-size: 16px;
              margin: 0;
              padding: 0;
          }
          .container {
              margin: 0 auto;
              max-width: 600px;
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
          }
          .heading {
              font-size: 34px;
              text-align: center;
              margin: 32px auto 16px;
          }
          .message {
              font-size: 16px;
              text-align: center;
              max-width: 600px;
              margin: 0 auto;
          }
          .logo {
              display: block;
              width: 100px;
              margin: 0 auto;
          }
          .container p {
              font-size: 18px;
              margin: 0 0 8px;
          }
          .container a {
              color: #fff;
              text-decoration: underline;
          }
          .container a:hover {
              color: #fff;
              text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <svg class="logo" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" id="Layer_1" x="0" y="0" viewBox="0 0 201.8 201.8"><style>.st1{fill-rule:evenodd;clip-rule:evenodd;fill:#504ecf}</style><circle cx="99.5" cy="100.5" r="96.6" style="fill:#fff"/><g id="_x38_YyQRx_00000042002604108115288630000003751367769792704158_"><path d="m116.4 57.4 4.7 1.8-14.9 42.9c-8.1 23.7-15.3 43.1-16 43.1-2.2-.4-4.3-1.1-6.3-2.1l-5-2.2 12.5-36.5 14.9-42.8c2.3-6.5 3-6.8 10.1-4.2zM68.7 85.1c-.6.6-5.1 4-10.3 7.5l-9.1 6.6 10.3 8.4 10.3 8.4-3.8 5.1c-2.2 2.6-4.1 5-4.5 5-.4 0-7.4-5.4-15.6-12.2l-17-13.7c-1.8-1.2 1.3-4.1 15.3-14.1l17.3-12.6 4 5.3c2.2 3 3.7 5.8 3.1 6.3zM158.6 89.2c7.2 5.1 12.5 9.9 11.8 10.4-6.8 5.9-32.7 26.5-33.2 26.5-1.7-1.6-3.2-3.3-4.6-5.1l-3.8-5 9.6-7.6c5.3-4.3 9.6-8.2 9.6-9 0-.7-4.3-4.3-9.4-7.9l-9.6-6.9 3.8-5.6 3.8-5.7 4.6 3.4 17.4 12.5z" class="st1"/></g></svg>
          <h1 class="heading">${title}</h1>
          <div class="message">${message}</div>
        </div>
      </body>
    </html>
  `;
}
