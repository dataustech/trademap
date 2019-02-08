/* eslint import/no-webpack-loader-syntax: 0 */
/* eslint import/no-extraneous-dependencies: 0 */
/* eslint import/first: 0 */
/* eslint import/no-unresolved: 0 */
/* eslint no-undef: 0 */

// html
import './index.html';
import './pages/contacts.html';
import './pages/cookie_policy.html';
import './pages/licence.html';

// txt & files
import 'file-loader?name=[name].[ext]!./robots.txt';
import 'file-loader?name=[name].[ext]!./humans.txt';
import 'file-loader?name=[name].[ext]!./img/favicon/browserconfig.xml';
import 'file-loader?name=[name].[ext]!./img/favicon/app.manifest';

// img
import './img/favicon/android-icon-144x144.png';
import './img/favicon/android-icon-192x192.png';
import './img/favicon/android-icon-36x36.png';
import './img/favicon/android-icon-48x48.png';
import './img/favicon/android-icon-72x72.png';
import './img/favicon/android-icon-96x96.png';
import './img/favicon/apple-icon-114x114.png';
import './img/favicon/apple-icon-120x120.png';
import './img/favicon/apple-icon-144x144.png';
import './img/favicon/apple-icon-152x152.png';
import './img/favicon/apple-icon-180x180.png';
import './img/favicon/apple-icon-57x57.png';
import './img/favicon/apple-icon-60x60.png';
import './img/favicon/apple-icon-72x72.png';
import './img/favicon/apple-icon-76x76.png';
import './img/favicon/apple-icon-precomposed.png';
import './img/favicon/apple-icon.png';
import './img/favicon/favicon-16x16.png';
import './img/favicon/favicon-32x32.png';
import './img/favicon/favicon-96x96.png';
import './img/favicon/favicon.ico';
import './img/favicon/ms-icon-144x144.png';
import './img/favicon/ms-icon-150x150.png';
import './img/favicon/ms-icon-310x310.png';
import './img/favicon/ms-icon-70x70.png';

// sass & css
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import 'intro.js/introjs.css';
import 'select2/dist/css/select2.css';
import 'select2-bootstrap-theme/dist/select2-bootstrap.css';
import './sass/main.scss';

// javascript libs
import $ from 'jquery';
import 'bootstrap';

// javascript app
import main from './lib/main';

// version
console.log(`${__PROJECT__} trademap: version ${__VERSION__} commit: ${__COMMIT_LINK__}`);

$(document).ready(() => main());
