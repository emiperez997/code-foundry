/**
 * .pnpmfile.cjs
 * Strips @types/pg from @prisma/adapter-pg to avoid the corporate
 * registry 403 on @types packages (pure JS, types not needed at runtime).
 */
function readPackage(pkg, context) {
  if (pkg.name === "@prisma/adapter-pg") {
    delete pkg.dependencies["@types/pg"];
    delete pkg.devDependencies?.["@types/pg"];
    context.log("Removed @types/pg from @prisma/adapter-pg");
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
