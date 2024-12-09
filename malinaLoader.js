import malina from "malinajs";
import { resolve, parse } from "path";

export default (options = {}) => {
	const cssModules = new Map();
	if (options.displayVersion !== false) console.log("! Malina.js", malina.version);
	return {
		name: "malina loader",
		setup(build) {
			build.onResolve({ filter: /^malinajs$/ }, async (args) => {
				return {
					path: resolve("node_modules", args.path, "runtime.js"),
				};
			});
			build.onLoad({ filter: /\.(xht|ma)$/ }, async ({ path }) => {
				const file = await Bun.file(path).text();
				const ctx = await malina.compile(file, {
					path,
					// name,
					...options,
				});
				let code = ctx.result;
				if (ctx.css.result) {
					let base = "./" + parse(path).base;
					const cssPath = base.replace(/\.\w+$/, ".malina.css").replace(/\\/g, "/");
					cssModules.set(cssPath, ctx.css.result);
					code += `\nimport "${cssPath}";`;
				}
				return {
					contents: code,
				};
			});
			build.onResolve({ filter: /\.malina\.css$/ }, ({ path }) => {
				return { path, namespace: "malinacss" };
			});
			build.onLoad({ filter: /\.malina\.css$/, namespace: "malinacss" }, (args) => {
				const css = cssModules.get(args.path);
				if (css) {
					return {
						contents: css,
						loader: "css",
					};
				}
			});
		},
	};
};
