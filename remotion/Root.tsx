import {Composition, Folder} from 'remotion';
import {SetForSixAd} from './SetForSixAd';
import {SetForSixTwitterAd} from './SetForSixTwitterAd';

export const RemotionRoot = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="SetForSixAd"
        component={SetForSixAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SetForSixTwitterAd"
        component={SetForSixTwitterAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1900}
      />
    </Folder>
  );
};
