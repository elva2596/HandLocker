// 二哲 - 2016年08月15日
const path = require('path');
const gulp = require('gulp');
const ugjs = require('gulp-uglify');
const watch = require('gulp-watch');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const named = require('vinyl-named');
const del = require('del');
const watchPath = require('gulp-watch-path');
const replace = require('gulp-replace');

const rev = require('gulp-rev');
const ifElse = require('gulp-if-else');
const browserSync = require('browser-sync').create();
const base64 = require('gulp-base64');
const runSequence = require('run-sequence');
const bsReload = browserSync.reload;
const postcss = require('gulp-postcss'); //postcss本身
const autoprefixer = require('autoprefixer');
const precss = require('precss'); //提供像scss一样的语法
const cssnano = require('cssnano');  //更好用的css压缩!
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const revCollector = require('gulp-rev-collector');
const exec = require('child_process').exec;
const CDN = 'http://127.0.0.1:63342/vue-multipage/public';
var webpackConfig = {
	resolve: {
		root: path.join(__dirname, 'node_modules'),
		alias: {
			components: '../../components' // 组件别名,js里引用路径可直接 'components/xxx/yyy'
		},
		extensions: ['', '.js', '.vue', '.scss', '.css']
	},
	output: {
		// publicPath: 'yourcdnlink/static/',
		filename: 'js/[name].js',
		chunkFilename: 'js/[id].js?[hash]'
	},
	module: {
		noParse: [/vue.js/],
		loaders: [
			{test: /\.vue$/, loader: 'vue'},
			{test: /\.js$/, loader: 'babel', exclude: /node_modules/},
			{
				test: /\.(png|jpe?g|gif)(\?.*)?$/,
				loader: 'url',
				query: {
					limit: 5000, // 换成你想要得大小
					name: 'models/[name].[ext]?[hash:10]'
				}
			},
			{
				test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
				loader: 'url',
				query: {
					limit: 5000, // 换成你想要得大小
					name: 'fonts/[name].[hash:7].[ext]'
				}
			}
		]
	},
	plugins: [],
	babel: { //配置babel
		"presets": ["es2015",'stage-2'],
		"plugins": ["transform-runtime"]
	}
};

const processes = [
	autoprefixer({browsers: ['last 2 version', 'safari 5', 'opera 12.1', 'ios 6', 'android 4', '> 10%']}),
	precss,
	cssnano
];
// background: color($blue blackness(20%));  precss为了用这样的语法
const src = {
	css: './src/css/**/*.css',
	fonts: './src/fonts/**/*.{eot,svg,ttf,woff}',
	models: './src/models/**/*.{png,jpg,jpeg,obj}',
	js: './src/js/**/*.{js,css}',
	views: './src/views/**/*.html'
};
const dist = {
	css: './public/css/',
	fonts: './public/fonts/',
	models: './public/models/',
	js: './public/js/',
	views: './public/views'
};
// dev启动
// 1.编译移动页面到public          OK
// 2.编译scss 输出到public         OK
// 3.编译js文件 输出public         OK
// 4.编译组件                      OK
// 5.输出图片和字体文件             OK
// 6.监听所有类型文件执行不同task    OK

// build
// 编译 压缩 css
// 编译 压缩 js
// 移动 图片和字体
var BUILD = "DEV";
gulp.task('views', function () {
	return gulp.src(src.views)
	.pipe(gulp.dest(dist.views));
});

gulp.task('css_dp', function () {
    gulp.src(src.css)
        .pipe(gulp.dest(dist.css));
});
gulp.task('reload', function () {

	webpackConfig.plugins.push(new webpack.DefinePlugin({
		NODE_ENV: JSON.stringify(process.env.NODE_ENV) || 'dev'
	}));
	runSequence('views','css_dp','js', 'models','fonts',function () {
		browserSync.init(dist.views, {
			startPath: "/views/",
			server: {
				baseDir : ['./public']
			},
			notify: false
		});
		dev();// watch

	});

});
function dev() {
	watch([src.views], function() {
		runSequence('views', function () {
			bsReload()
		});
	});
    watch([src.css], function () {
        runSequence('css_dp', function () {
            bsReload()
        });
    });
	watch([src.models], function() {
		runSequence('models', function () {
			bsReload()
		});
	});
	watch([src.fonts], function() {
		runSequence('fonts', function () {
			bsReload()
		});
	});
	watch([src.js], function (event) {
		var paths = watchPath(event, src.js, './public/js/');
		var sp = paths.srcPath.indexOf('\\') > -1 ? '\\' : '/';

		if(paths.srcPath.split(sp).length === 3) { // 共有库情况,要编译所有js
			compileJS(['./src/js/**/*.js','!./src/js/lib/*.{js,css}']);
		} else { // 否则 只编译变动js
			compileJS(paths.srcPath);
		}
	});
}

gulp.task('js', function () {
	cp('./src/js/lib/*.{js,css}','./public/js/lib');
	return compileJS(['./src/js/**/*.js','!./src/js/lib/*.{js,css}']);
});

gulp.task('models', function () {
	gulp.src(src.models)
	.pipe(gulp.dest(dist.models));
});
gulp.task('fonts', function () {
	return gulp.src(src.fonts)
	.pipe(gulp.dest(dist.fonts));
});
gulp.task('js:build', function () {
	cp('./src/js/lib/*.{js,css}','./src/tmp/js/lib');
	return compileJS(['./src/js/**/*.js','!./src/js/lib/*.js'],'./src/tmp');
});
gulp.task('ugjs:build', function () {
	return gulp.src('./src/tmp/**/*.js')
	.pipe(ifElse(BUILD === 'PUBLIC', ugjs))
	.pipe(rev())
	.pipe(gulp.dest('./public/'))
	.pipe(rev.manifest())
	.pipe(gulp.dest('./public/'))
});
function compileJS(path,dest) {
	dest = dest || './public';
	webpackConfig.output.publicPath = BUILD === 'PUBLIC' ? ''+ CDN +'/' : '/';

	return gulp.src(path)
	.pipe(named(function (file) {
		var path = JSON.parse(JSON.stringify(file)).history[0];
		var sp = path.indexOf('\\') > -1 ? '\\js\\' : '/js/';
		var target = path.split(sp)[1];
		return target.substring(0,target.length - 3);
	}))
	.pipe(webpackStream(webpackConfig))
	.on('error',function(err) {
		this.end()
	})
	.pipe(browserSync.reload({
		stream: true
	}))
	.pipe(gulp.dest(dest))
}
function cp(from,to) {
	gulp.src(from)
	.pipe(gulp.dest(to));
}

gulp.task('views:build', function () {
	return gulp.src(['./public/**/*.json', src.views])
	.pipe(revCollector({
		replaceReved: true
	}))
	.pipe(replace('../../', ''+ CDN +'/')) // 替换html页面静态资源地址
	.pipe(replace('../', ''+ CDN +'/')) // 替换html页面静态资源地址
	.pipe(gulp.dest(dist.views));
});

gulp.task('build', function () {
	BUILD = 'PUBLIC';
	webpackConfig.plugins.push(new webpack.DefinePlugin({
		NODE_ENV: JSON.stringify(process.env.NODE_ENV) || 'production'
	}));
	build(function() {
		del(['./src/tmp'])
	});
});
gulp.task('css:build', function () {
	return gulp.src(src.css)
	.pipe(base64({
		extensions: ['png', /\.jpg#datauri$/i],
		maxImageSize: 10 * 1024 // bytes,
	}))
	.pipe(ifElse(BUILD === 'PUBLIC', function () {
		return postcss(processes)
	}))
	.pipe(rev())
	.pipe(gulp.dest(dist.css))
	.pipe(rev.manifest())
	.pipe(gulp.dest(dist.css))
});
function build(cb) {
	runSequence('clean','css_dp', 'css:build','js:build', 'ugjs:build', 'views:build', 'models', 'fonts',function() {
		// 上传静态资源文件到CDN
		cb && cb();
		/*exec('node upload.js', function (err, output) {
			if(err) console.log(err);
			console.log(output);
		});*/
	});
}
gulp.task('clean', function () {
	del([
		'public/**/*'
	]);
});
