// html
import './index.html';

// txt
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
main()
