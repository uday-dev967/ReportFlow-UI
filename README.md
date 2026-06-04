# 

## Assets

This folder includes an 'scss' folder for all our CSS files. Any images should also be placed here, potentially within nested subfolders. We have a getAssets.js file to manage these images. To use these images in any of our Vue files, you need to inject appImages into the file and access the image by passing the file name to appImages, like this: appImages['loader.gif']. An example of this usage can be seen in CircularProgressBar.vue.
We can group the media assets by routes or functionality depending on the architecture of the application

## Assets/Scss

In SCSS (Sass), using an underscore (\_) at the beginning of a file name is a convention to indicate that the file is a partial. Partial files are intended to be included in other SCSS files using the @import rule and are not compiled to CSS on their own.

#### \_variables.scss

This file contains all the scss variables that we will be using throughout the application

#### \_typology.scss

Here we change the font-size of the html dom, what this does is it scales down the application if we use rem throughout instead of px

#### \_mixins.scss

We can either have one mixin file that contains all the mixin or break them into multiple and import them in this file, for more information you can search for what scss mixins are

#### global.scss

This serves as the main scss file where everything else is imported to and can contain all the common scss logic

## Components

This folder contains all the components. Within it, there's a 'sharedComponents' folder that holds fundamental components not tied to the current project. These components are versatile and can be used across various projects, making them easily transferable to any of our different projects.
We follow capitalcase as the naming convention for components, where we group them by routes or functionality depending on the architecture of the application

## Composable

The composables folder in the contains reusable logic and state management functions that can be shared across multiple components. These composables allow you to encapsulate and organize functionality, making it easy to import and use them in different parts of your application. By utilizing composables, you can keep your components clean and focused on presentation while handling business logic and state management in a centralized manner.

## Locales (i18n)

The locales folder is dedicated to internationalization, containing localization files and configurations that enable the application to support multiple languages and regional settings. This allows you to provide translations and adapt the user interface to different locales, enhancing the application's accessibility and usability for a global audience. Our structure involves placing all English strings in en.json. You can create multiple files for different languages, such as es.json for Spanish or jp.json for Japanese. These files need to be imported into the i18n.js file.

## Network

This Folder conatins all the API calls that we will make throughout the application, the structure that we follow is we add the endpoint URL to apiRoutes.js this is then used in project.service.js where we make a function which will be further imported into our store, while defining this function we use already created wrapper functions for making GET, PUT, POST, DELETE function call, these functions use the axios instance created in appAxios.js file

#### appAxios.js

Here we access our applications backend url from .env and create an axios instance which will be further used to create actual API calls

#### api.js

This file contains wrapper functions for making GET, PUT, POST, DELETE function call, these functions use the axios instance created in appAxios.js file

#### apiRoutes.js

We define all the url in this file
Lets assume the endpoint to hit is 'https://myapplication.domain.com/login'. 'https://myapplication.domain.com/' will already be defined in the .env file. the remaining string 'login' will be defined in this file
Note - In order to make an API call that isnt a part of the URL we have defined in the .env file we can define the entire url here instead of just part of it

#### project.service.js

This file contains all of our API call defination, you can have a look at the two examples shown in this file, we have a handle401 function which can be used to log the user out, this can be removed based on the requirment and ux of the application

## Router

The router folder in the Vue file structure contains all the routing configurations for the application. This includes the setup for defining and managing routes, navigation guards, and route-based code splitting. 'index.js' contains the main router setup and any additional route configuration files as needed.

## Stores

The stores folder in the Vue file structure contains the application's state management configurations and logic, utilizing Pinia for state management.
We follow a file naming convention of [fileName].store.js

## Views

The views folder in the Vue file structure contains the main views or pages of the application. Each file within this folder represents a different page or route, ensuring a clear separation between the overall layout and individual page content. This organization helps maintain a clean and manageable project structure, making it easy to develop and navigate through the application's different sections.
We follow a file naming convention of [routeName]Wrapper.vue, for example [Home]Wrapper.vue & [Login]Wrapper.vue Where we follow capitalcase

## Provider.vue

This is the main file that gets imported to our main.js script, this is the entry point of the application, this is where we check if the user is authorized to access the application. We do that by checking the auth token in the local storage

## Constants.js

We maintain a central Constant files for string that need to be reffered in multiple places. This keeps the code clean. This can be used in a similar fashion as appImages, where we will have to inject constants into a vue file to use in the dom, this is also attached to the window to be used elsewhere in the app

## i18n.js

This is the file where i18n Instance is created, we can provide jsons of more languages and add them here
