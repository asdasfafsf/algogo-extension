import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // 개발 모드 (프로덕션은 'production'으로 변경)
  mode: 'development',
  
  // 소스맵 생성 (디버깅용)
  devtool: 'cheap-source-map',
  
  // 진입점 설정
  entry: {
    background: './src/background/background.ts',
    content: './src/content/content.ts',
    // 팝업이 있다면 추가
    // popup: './src/popup/popup.ts',
  },
  
  // 출력 설정
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // 빌드 전 dist 폴더 정리
  },
  
  // 파일 확장자 해석 설정
  resolve: {
    extensions: ['.ts', '.js'],
  },
  
  // 모듈 처리 규칙
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  // 최적화 설정 - 코드 분할 비활성화
  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: false,
        default: false
      }
    }
  },
  
  // 플러그인 설정
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: '.' },
        // 또는 public 디렉토리 전체를 복사
        { from: 'public', to: '.' },
      ],
    }),
  ],
  
  // 파일 시스템 캐싱 비활성화
  cache: false,
};