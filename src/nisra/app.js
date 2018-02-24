/* eslint import/no-webpack-loader-syntax: 0 */
/* eslint import/no-extraneous-dependencies: 0 */
/* eslint import/first: 0 */
/* eslint import/no-unresolved: 0 */

// html
import './index.html';

// txt & csv
import 'file-loader?name=[name].[ext]!./robots.txt';
import 'file-loader?name=[name].[ext]!./humans.txt';

// img
import './favicon.ico';

// sass to css
import './sass/main.scss';

// javascript libs
import 'bootstrap';

// javascript app
import main from './lib/main';

main();
