import { sync } from 'fast-glob';
import { resolve, join } from 'path';
import { lstatSync, realpathSync } from 'fs';

function getLinkedPackages(cwd: string) {
	const linksWithRealPaths: Record<string, string> = {};
	const symlinks = sync(
		'{@*/*,[^@]*}',
		{ 
			cwd,
			onlyDirectories: true
		}
	).filter(file => lstatSync(join(cwd, file)).isSymbolicLink())
	.forEach(symlink => {
		linksWithRealPaths[symlink] = realpathSync(
            resolve(cwd, symlink)
        );
	});

	return linksWithRealPaths;
}

type MetroConfig = Object & {
	resolver: Object & {
		extraNodeModules: Record<string, string>
	},
	watchFolders: string[]
}

export default <T extends MetroConfig>(metroConfig: T, nodeModulesPath?: string): T => {
	const symlinksWithRealPaths = getLinkedPackages(nodeModulesPath || resolve(process.cwd(), 'node_modules'));
	console.log(symlinksWithRealPaths);
	
	return {
		...metroConfig,
		resolver: {
			...metroConfig.resolver,
			extraNodeModules: {
				...(metroConfig.resolver && metroConfig.resolver.extraNodeModules),
				...symlinksWithRealPaths
			}
		},
		watchFolders: metroConfig.watchFolders 
			? metroConfig.watchFolders.concat(Object.values(symlinksWithRealPaths))
			: Object.values(symlinksWithRealPaths)
	}
};
