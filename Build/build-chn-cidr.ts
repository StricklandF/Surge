import { fetchRemoteTextByLine } from './lib/fetch-text-by-line';
import { resolve as pathResolve } from 'path';
import { compareAndWriteFile, withBannerArray } from './lib/create-file';
import { processLineFromReadline } from './lib/process-line';
import { task } from './trace';

import { exclude } from 'fast-cidr-tools';
import { createMemoizedPromise } from './lib/memo-promise';
import { CN_CIDR_NOT_INCLUDED_IN_CHNROUTE, NON_CN_CIDR_INCLUDED_IN_CHNROUTE } from './constants/cidr';

export const getChnCidrPromise = createMemoizedPromise(async () => {
  const cidr = await processLineFromReadline(await fetchRemoteTextByLine('https://raw.githubusercontent.com/misakaio/chnroutes2/master/chnroutes.txt'));
  return exclude([...cidr, ...CN_CIDR_NOT_INCLUDED_IN_CHNROUTE], NON_CN_CIDR_INCLUDED_IN_CHNROUTE, true);
});

export const buildChnCidr = task(import.meta.path, async (span) => {
  const filteredCidr = await span.traceChildAsync('download chnroutes2', getChnCidrPromise);

  // Can not use SHARED_DESCRIPTION here as different license
  const description = [
    'License: CC BY-SA 2.0',
    'Homepage: https://ruleset.skk.moe',
    'GitHub: https://github.com/SukkaW/Surge',
    '',
    'Data from https://misaka.io (misakaio @ GitHub)'
  ];

  // Can not use createRuleset here, as Clash support advanced ipset syntax
  return Promise.all([
    compareAndWriteFile(
      span,
      withBannerArray(
        'Sukka\'s Ruleset - Mainland China IPv4 CIDR',
        description,
        new Date(),
        filteredCidr.map(i => `IP-CIDR,${i}`)
      ),
      pathResolve(import.meta.dir, '../List/ip/china_ip.conf')
    ),
    compareAndWriteFile(
      span,
      withBannerArray(
        'Sukka\'s Ruleset - Mainland China IPv4 CIDR',
        description,
        new Date(),
        filteredCidr
      ),
      pathResolve(import.meta.dir, '../Clash/ip/china_ip.txt')
    )
  ]);
});

if (import.meta.main) {
  buildChnCidr();
}
