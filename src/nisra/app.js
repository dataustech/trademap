// html & txt
import 'file-loader?name=[name].[ext]!./index.html'
import 'file-loader?name=[name].[ext]!./robots.txt'
import 'file-loader?name=[name].[ext]!./humans.txt'

// sass to css
import './sass/main.scss';

// javascript
import $ from "jquery";
import 'bootstrap';