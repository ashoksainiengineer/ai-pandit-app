# BTR Data Analysis Plan
## Comprehensive Analysis of 909MB Captured BTR Data

---

## Executive Summary

This document outlines an industry-standard, production-ready analysis plan for 909MB of BTR (Birth Time Rectification) captured data spanning 3,301 files across 6 pipeline stages.

**Data Overview:**
- **Size**: 909 MB
- **Files**: 3,301
- **Stages**: 6 (Stage 2, 4, 6 primarily)
- **Format**: JSON (structured), TXT (human-readable), JSONL (stream)
- **Content**: Ephemeris, prompts, AI thinking, responses, metadata

---

## Phase 1: Data Infrastructure & Validation

### 1.1 Project Structure
```
btr-analysis/
├── data/
│   ├── raw/                    # Raw traces (read-only)
│   ├── processed/              # Cleaned data
│   └── derived/                # Aggregated datasets
├── notebooks/
│   ├── 01_eda.ipynb           # Exploratory analysis
│   ├── 02_ephemeris.ipynb     # Astrological patterns
│   ├── 03_ai_behavior.ipynb   # AI analysis
│   ├── 04_performance.ipynb   # Pipeline metrics
│   └── 05_final_report.ipynb  # Comprehensive report
├── src/
│   ├── __init__.py
│   ├── data_loader.py         # Data ingestion
│   ├── validators.py          # Schema validation
│   ├── transformers.py        # Data transformations
│   ├── analyzers/
│   │   ├── ephemeris.py       # Astrological analysis
│   │   ├── ai_behavior.py     # AI pattern analysis
│   │   └── performance.py     # Performance metrics
│   └── visualizations/
│       ├── plots.py
│       └── dashboards.py
├── config/
│   ├── schema.yaml            # Data schemas
│   └── analysis_config.yaml   # Analysis parameters
├── outputs/
│   ├── figures/               # Generated plots
│   ├── reports/               # Analysis reports
│   └── dashboards/            # Interactive dashboards
└── tests/
```

### 1.2 Data Ingestion Pipeline

```python
# src/data_loader.py
import json
import jsonlines
import pandas as pd
from pathlib import Path
from typing import Iterator, Dict, Any
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BTRDataConfig:
    """Configuration for BTR data loading"""
    base_path: Path = Path("/tmp/btr-traces/modi_research_1773761639037")
    max_workers: int = 8
    chunk_size: int = 1000

class BTRDataLoader:
    """Production-grade data loader for BTR traces"""
    
    def __init__(self, config: BTRDataConfig = None):
        self.config = config or BTRDataConfig()
        self.schema_validator = SchemaValidator()
        
    def load_all_stages(self) -> Dict[str, pd.DataFrame]:
        """Load all stages into memory-efficient DataFrames"""
        logger.info("Starting data ingestion...")
        
        stages = {}
        for stage_num in [2, 4, 6]:
            stage_path = self.config.base_path / f"stage-{stage_num}"
            if stage_path.exists():
                stages[f"stage_{stage_num}"] = self._load_stage(stage_path, stage_num)
                
        logger.info(f"Loaded {len(stages)} stages")
        return stages
    
    def _load_stage(self, stage_path: Path, stage_num: int) -> pd.DataFrame:
        """Load a single stage with parallel processing"""
        records = []
        
        # Collect all JSON files
        json_files = list(stage_path.rglob("*.json"))
        jsonl_files = list(stage_path.rglob("*.jsonl"))
        
        # Process in parallel
        with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
            # Process regular JSON files
            json_results = executor.map(self._load_json_file, json_files)
            records.extend([r for r in json_results if r is not None])
            
            # Process JSONL files
            for jsonl_file in jsonl_files:
                records.extend(self._load_jsonl_file(jsonl_file))
        
        df = pd.DataFrame(records)
        logger.info(f"Stage {stage_num}: Loaded {len(df)} records")
        return df
    
    def _load_json_file(self, file_path: Path) -> Dict[str, Any]:
        """Load and validate a single JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Add metadata
            data['_source_file'] = str(file_path)
            data['_stage'] = self._extract_stage(file_path)
            data['_round'] = self._extract_round(file_path)
            data['_batch'] = self._extract_batch(file_path)
            data['_candidate_time'] = self._extract_candidate_time(file_path)
            
            return data
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            return None
    
    def _load_jsonl_file(self, file_path: Path) -> list:
        """Load JSONL file with streaming"""
        records = []
        try:
            with jsonlines.open(file_path) as reader:
                for obj in reader:
                    obj['_source_file'] = str(file_path)
                    records.append(obj)
        except Exception as e:
            logger.error(f"Error loading JSONL {file_path}: {e}")
        return records

class SchemaValidator:
    """Validate data against expected schemas"""
    
    EPHEMERIS_SCHEMA = {
        'required': ['planets', 'houses', 'lagna'],
        'types': {
            'planets': dict,
            'houses': dict,
            'lagna': str
        }
    }
    
    PROMPT_SCHEMA = {
        'required': ['system', 'user'],
        'types': {
            'system': str,
            'user': str
        }
    }
    
    RESPONSE_SCHEMA = {
        'required': ['score', 'verdict'],
        'types': {
            'score': (int, float),
            'verdict': str
        }
    }
    
    def validate_ephemeris(self, data: Dict) -> bool:
        return self._validate(data, self.EPHEMERIS_SCHEMA)
    
    def _validate(self, data: Dict, schema: Dict) -> bool:
        # Check required fields
        for field in schema['required']:
            if field not in data:
                return False
        # Check types
        for field, expected_type in schema['types'].items():
            if field in data and not isinstance(data[field], expected_type):
                return False
        return True
```

### 1.3 Data Quality Checks

```python
# src/validators.py
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
import great_expectations as gx

class DataQualityChecker:
    """Industry-standard data quality validation"""
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.expectation_suite = gx.ExpectationSuite(
            name="btr_data_quality"
        )
    
    def run_all_checks(self) -> Dict:
        """Run comprehensive data quality checks"""
        results = {
            'completeness': self._check_completeness(),
            'uniqueness': self._check_uniqueness(),
            'validity': self._check_validity(),
            'consistency': self._check_consistency(),
            'timeliness': self._check_timeliness()
        }
        return results
    
    def _check_completeness(self) -> Dict:
        """Check for missing values"""
        missing = self.df.isnull().sum()
        missing_pct = (missing / len(self.df)) * 100
        return {
            'missing_counts': missing.to_dict(),
            'missing_percentages': missing_pct.to_dict(),
            'columns_with_missing': missing[missing > 0].index.tolist()
        }
    
    def _check_uniqueness(self) -> Dict:
        """Check for duplicate records"""
        duplicates = self.df.duplicated().sum()
        return {
            'total_duplicates': int(duplicates),
            'duplicate_percentage': (duplicates / len(self.df)) * 100
        }
    
    def _check_validity(self) -> Dict:
        """Check data validity against business rules"""
        checks = {}
        
        # Score should be between 0-100
        if 'score' in self.df.columns:
            invalid_scores = self.df[
                (self.df['score'] < 0) | (self.df['score'] > 100)
            ]
            checks['invalid_scores'] = len(invalid_scores)
        
        # Timestamp validity
        if 'timestamp' in self.df.columns:
            invalid_timestamps = pd.to_datetime(
                self.df['timestamp'], errors='coerce'
            ).isna().sum()
            checks['invalid_timestamps'] = int(invalid_timestamps)
        
        return checks
    
    def generate_report(self) -> str:
        """Generate markdown quality report"""
        results = self.run_all_checks()
        
        report = """
# Data Quality Report

## Summary
- Total Records: {total}
- Total Columns: {columns}

## Completeness
{completeness}

## Uniqueness
{uniqueness}

## Validity
{validity}
""".format(
            total=len(self.df),
            columns=len(self.df.columns),
            completeness=results['completeness'],
            uniqueness=results['uniqueness'],
            validity=results['validity']
        )
        
        return report
```

---

## Phase 2: Exploratory Data Analysis (EDA)

### 2.1 Descriptive Statistics

```python
# notebooks/01_eda.ipynb
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

class BTRExploratoryAnalysis:
    """Comprehensive EDA for BTR data"""
    
    def __init__(self, stages_data: Dict[str, pd.DataFrame]):
        self.stages = stages_data
        self.summary_stats = {}
    
    def analyze_score_distributions(self) -> None:
        """Analyze AI score distributions across stages"""
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=[
                'Score Distribution by Stage',
                'Score Box Plot by Stage',
                'Score Trends Over Time',
                'Score Histogram Comparison'
            ]
        )
        
        scores_by_stage = []
        for stage_name, df in self.stages.items():
            if 'score' in df.columns:
                scores_by_stage.append({
                    'stage': stage_name,
                    'scores': df['score'].dropna()
                })
        
        # Distribution plot
        for i, stage_data in enumerate(scores_by_stage):
            fig.add_trace(
                go.Histogram(
                    x=stage_data['scores'],
                    name=stage_data['stage'],
                    opacity=0.7,
                    nbinsx=20
                ),
                row=1, col=1
            )
        
        # Box plot
        fig.add_trace(
            go.Box(
                y=np.concatenate([s['scores'] for s in scores_by_stage]),
                x=np.concatenate([
                    [s['stage']] * len(s['scores']) 
                    for s in scores_by_stage
                ]),
                name='Score Distribution'
            ),
            row=1, col=2
        )
        
        fig.update_layout(height=800, showlegend=True)
        fig.write_html("outputs/figures/score_distributions.html")
        
    def analyze_candidate_flow(self) -> pd.DataFrame:
        """Track candidate survival rates across stages"""
        flow_data = []
        
        for stage_name, df in self.stages.items():
            if 'candidate_time' in df.columns:
                unique_candidates = df['candidate_time'].nunique()
                flow_data.append({
                    'stage': stage_name,
                    'candidates': unique_candidates,
                    'batches': df['batch'].nunique() if 'batch' in df.columns else 0,
                    'rounds': df['round'].nunique() if 'round' in df.columns else 0
                })
        
        flow_df = pd.DataFrame(flow_data)
        
        # Create Sankey diagram
        fig = go.Figure(data=[go.Sankey(
            node=dict(
                pad=15,
                thickness=20,
                line=dict(color="black", width=0.5),
                label=flow_df['stage'].tolist(),
                color="blue"
            ),
            link=dict(
                source=list(range(len(flow_df)-1)),
                target=list(range(1, len(flow_df))),
                value=flow_df['candidates'].tolist()[:-1]
            )
        )])
        
        fig.update_layout(title_text="Candidate Flow Across Stages")
        fig.write_html("outputs/figures/candidate_flow.html")
        
        return flow_df
    
    def temporal_analysis(self) -> None:
        """Analyze temporal patterns in AI processing"""
        temporal_data = []
        
        for stage_name, df in self.stages.items():
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                temporal_data.append({
                    'stage': stage_name,
                    'timestamps': df['timestamp'],
                    'duration': (
                        df['timestamp'].max() - df['timestamp'].min()
                    ).total_seconds()
                })
        
        # Processing time analysis
        fig = px.timeline(
            pd.DataFrame([
                {
                    'Stage': t['stage'],
                    'Start': t['timestamps'].min(),
                    'End': t['timestamps'].max(),
                    'Duration (s)': t['duration']
                }
                for t in temporal_data
            ]),
            x_start="Start",
            x_end="End",
            y="Stage",
            color="Duration (s)"
        )
        
        fig.write_html("outputs/figures/temporal_analysis.html")

    def correlation_analysis(self) -> None:
        """Analyze correlations between variables"""
        # Combine all numerical columns
        all_numerical = pd.DataFrame()
        
        for stage_name, df in self.stages.items():
            numerical = df.select_dtypes(include=[np.number])
            if not numerical.empty:
                numerical = numerical.add_prefix(f"{stage_name}_")
                all_numerical = pd.concat([all_numerical, numerical], axis=1)
        
        # Correlation matrix
        corr_matrix = all_numerical.corr()
        
        fig = px.imshow(
            corr_matrix,
            text_auto=True,
            aspect="auto",
            color_continuous_scale="RdBu",
            title="Feature Correlation Matrix"
        )
        
        fig.write_html("outputs/figures/correlation_matrix.html")
```

### 2.2 Astrological Data Analysis

```python
# notebooks/02_ephemeris.ipynb
import swisseph as swe
from collections import defaultdict
import astropy.units as u
from astropy.coordinates import SkyCoord

class EphemerisAnalyzer:
    """Deep analysis of astrological ephemeris data"""
    
    def __init__(self, ephemeris_df: pd.DataFrame):
        self.df = ephemeris_df
        self.planet_names = [
            'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
            'Jupiter', 'Saturn', 'Rahu', 'Ketu'
        ]
        self.house_names = [f'House_{i}' for i in range(1, 13)]
    
    def analyze_planetary_positions(self) -> Dict:
        """Analyze distribution of planetary positions"""
        results = {}
        
        for planet in self.planet_names:
            if planet in self.df.columns:
                positions = self.df[planet].dropna()
                
                results[planet] = {
                    'mean_longitude': positions.mean(),
                    'std_longitude': positions.std(),
                    'min_longitude': positions.min(),
                    'max_longitude': positions.max(),
                    'zodiac_distribution': self._calculate_zodiac_distribution(
                        positions
                    )
                }
        
        return results
    
    def _calculate_zodiac_distribution(self, positions: pd.Series) -> Dict:
        """Calculate how planets are distributed across zodiac signs"""
        zodiac_signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer',
            'Leo', 'Virgo', 'Libra', 'Scorpio',
            'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ]
        
        # Each sign spans 30 degrees
        sign_boundaries = list(range(0, 361, 30))
        
        distribution = defaultdict(int)
        for pos in positions:
            sign_index = int(pos // 30)
            if sign_index < 12:
                distribution[zodiac_signs[sign_index]] += 1
        
        return dict(distribution)
    
    def analyze_house_placements(self) -> pd.DataFrame:
        """Analyze house lord placements"""
        house_analysis = []
        
        for idx, row in self.df.iterrows():
            if 'houses' in row and isinstance(row['houses'], dict):
                houses = row['houses']
                
                analysis = {
                    'candidate_time': row.get('candidate_time'),
                    'lagna': row.get('lagna'),
                    'house_count': len(houses),
                    'occupied_houses': sum(
                        1 for h in houses.values() if h
                    ),
                    'empty_houses': sum(
                        1 for h in houses.values() if not h
                    )
                }
                house_analysis.append(analysis)
        
        return pd.DataFrame(house_analysis)
    
    def create_zodiac_wheel(self, candidate_time: str = None) -> go.Figure:
        """Create interactive zodiac wheel visualization"""
        if candidate_time:
            data = self.df[
                self.df['candidate_time'] == candidate_time
            ].iloc[0]
        else:
            data = self.df.iloc[0]
        
        fig = go.Figure()
        
        # Draw zodiac wheel
        zodiac_signs = [
            'Aries', 'Taurus', 'Gemini', 'Cancer',
            'Leo', 'Virgo', 'Libra', 'Scorpio',
            'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ]
        
        for i, sign in enumerate(zodiac_signs):
            angle = i * 30
            # Add sign label
            fig.add_annotation(
                x=1.3 * np.cos(np.radians(angle)),
                y=1.3 * np.sin(np.radians(angle)),
                text=sign,
                showarrow=False,
                font=dict(size=10)
            )
        
        # Add planets
        if 'planets' in data and isinstance(data['planets'], dict):
            for planet, position in data['planets'].items():
                angle = position
                fig.add_trace(go.Scatter(
                    x=[0.8 * np.cos(np.radians(angle))],
                    y=[0.8 * np.sin(np.radians(angle))],
                    mode='markers+text',
                    marker=dict(size=15),
                    text=planet,
                    name=planet
                ))
        
        fig.update_layout(
            title=f"Zodiac Wheel - {candidate_time or 'Sample'}",
            xaxis=dict(scaleanchor="y", scaleratio=1),
            showlegend=True
        )
        
        return fig
    
    def analyze_dasha_patterns(self) -> pd.DataFrame:
        """Analyze Vimshottari Dasha patterns"""
        dasha_data = []
        
        for idx, row in self.df.iterrows():
            if 'vimshottariDasha' in row:
                dasha = row['vimshottariDasha']
                if isinstance(dasha, dict):
                    dasha_data.append({
                        'candidate_time': row.get('candidate_time'),
                        'mahadasha': dasha.get('mahadasha'),
                        'antardasha': dasha.get('antardasha'),
                        'pratyantardasha': dasha.get('pratyantardasha'),
                        'start_date': dasha.get('startDate'),
                        'end_date': dasha.get('endDate')
                    })
        
        return pd.DataFrame(dasha_data)
```

---

## Phase 3: AI Behavior Analysis

### 3.1 Prompt Analysis

```python
# notebooks/03_ai_behavior.ipynb
import re
from textstat import flesch_reading_ease, flesch_kincaid_grade
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from wordcloud import WordCloud
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

# Download required NLTK data
# nltk.download('punkt')
# nltk.download('stopwords')

class PromptAnalyzer:
    """Analyze AI prompts for patterns and quality"""
    
    def __init__(self, prompts_df: pd.DataFrame):
        self.df = prompts_df
        self.stop_words = set(stopwords.words('english'))
    
    def analyze_prompt_complexity(self) -> pd.DataFrame:
        """Measure prompt complexity metrics"""
        metrics = []
        
        for idx, row in self.df.iterrows():
            user_prompt = row.get('user', '')
            system_prompt = row.get('system', '')
            
            combined = f"{system_prompt} {user_prompt}"
            
            metrics.append({
                'candidate_time': row.get('candidate_time'),
                'stage': row.get('stage'),
                'user_length': len(user_prompt),
                'system_length': len(system_prompt),
                'total_length': len(combined),
                'user_tokens': len(word_tokenize(user_prompt)),
                'system_tokens': len(word_tokenize(system_prompt)),
                'flesch_ease': flesch_reading_ease(combined),
                'flesch_grade': flesch_kincaid_grade(combined),
                'sentence_count': len(sent_tokenize(combined)),
                'avg_sentence_length': len(word_tokenize(combined)) / max(len(sent_tokenize(combined)), 1)
            })
        
        return pd.DataFrame(metrics)
    
    def extract_prompt_patterns(self) -> Dict:
        """Extract common patterns from prompts"""
        all_prompts = ' '.join(
            self.df['user'].fillna('') + ' ' + 
            self.df['system'].fillna('')
        )
        
        # Common phrases
        common_phrases = self._extract_ngrams(all_prompts, n=3)
        
        # Astrological terms
        astro_terms = re.findall(
            r'\b(planet|house|lagna|dasha|nakshatra|varga|D9|D10|transit)\b',
            all_prompts,
            re.IGNORECASE
        )
        
        # Instruction patterns
        instruction_patterns = re.findall(
            r'\b(analyze|evaluate|score|compare|determine|assess)\b',
            all_prompts,
            re.IGNORECASE
        )
        
        return {
            'common_phrases': Counter(common_phrases).most_common(20),
            'astrological_terms': Counter(astro_terms).most_common(20),
            'instruction_patterns': Counter(instruction_patterns).most_common(10)
        }
    
    def _extract_ngrams(self, text: str, n: int = 3) -> List[str]:
        """Extract n-grams from text"""
        words = word_tokenize(text.lower())
        words = [w for w in words if w.isalnum() and w not in self.stop_words]
        
        ngrams = []
        for i in range(len(words) - n + 1):
            ngrams.append(' '.join(words[i:i+n]))
        
        return ngrams
    
    def cluster_prompts(self, n_clusters: int = 5) -> pd.DataFrame:
        """Cluster prompts by similarity"""
        vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        tfidf_matrix = vectorizer.fit_transform(
            self.df['user'].fillna('')
        )
        
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(tfidf_matrix)
        
        self.df['prompt_cluster'] = clusters
        
        # Get cluster characteristics
        cluster_info = []
        for i in range(n_clusters):
            cluster_prompts = self.df[self.df['prompt_cluster'] == i]['user']
            cluster_info.append({
                'cluster_id': i,
                'count': len(cluster_prompts),
                'avg_length': cluster_prompts.str.len().mean(),
                'sample': cluster_prompts.iloc[0][:200] if len(cluster_prompts) > 0 else ''
            })
        
        return pd.DataFrame(cluster_info)
    
    def generate_wordcloud(self, output_path: str = None) -> WordCloud:
        """Generate word cloud from prompts"""
        all_text = ' '.join(
            self.df['user'].fillna('').astype(str)
        )
        
        wordcloud = WordCloud(
            width=1200,
            height=800,
            background_color='white',
            stopwords=self.stop_words,
            max_words=200
        ).generate(all_text)
        
        if output_path:
            wordcloud.to_file(output_path)
        
        return wordcloud

class ThinkingAnalyzer:
    """Analyze AI thinking/reasoning patterns"""
    
    def __init__(self, thinking_files: List[Path]):
        self.files = thinking_files
        self.thinking_data = []
    
    def load_all_thinking(self) -> pd.DataFrame:
        """Load all thinking files"""
        for file_path in self.files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Extract metadata from filename
                # Format: stage-X-R#-B#-thinking.txt
                parts = file_path.stem.split('-')
                
                self.thinking_data.append({
                    'file': str(file_path),
                    'stage': parts[1] if len(parts) > 1 else None,
                    'round': parts[2] if len(parts) > 2 else None,
                    'batch': parts[3] if len(parts) > 3 else None,
                    'content': content,
                    'length': len(content),
                    'line_count': content.count('\n'),
                    'word_count': len(content.split()),
                    'char_count': len(content)
                })
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
        
        return pd.DataFrame(self.thinking_data)
    
    def analyze_reasoning_patterns(self) -> Dict:
        """Extract reasoning patterns from thinking"""
        patterns = {
            'decision_keywords': [],
            'evaluation_keywords': [],
            'comparison_keywords': [],
            'uncertainty_markers': []
        }
        
        decision_words = ['choose', 'select', 'pick', 'determine', 'conclude', 'decide']
        evaluation_words = ['score', 'rate', 'evaluate', 'assess', 'judge', 'measure']
        comparison_words = ['compare', 'versus', 'vs', 'better', 'worse', 'higher', 'lower']
        uncertainty_words = ['maybe', 'perhaps', 'uncertain', 'unclear', 'possibly', 'might']
        
        for thinking in self.thinking_data:
            content = thinking['content'].lower()
            
            patterns['decision_keywords'].extend(
                [w for w in decision_words if w in content]
            )
            patterns['evaluation_keywords'].extend(
                [w for w in evaluation_words if w in content]
            )
            patterns['comparison_keywords'].extend(
                [w for w in comparison_words if w in content]
            )
            patterns['uncertainty_markers'].extend(
                [w for w in uncertainty_words if w in content]
            )
        
        return {k: Counter(v).most_common(10) for k, v in patterns.items()}
    
    def extract_scores_from_thinking(self) -> pd.DataFrame:
        """Extract scores mentioned in thinking"""
        scores_data = []
        
        score_pattern = r'(\d{2,3})\s*/\s*100|\bscore\s*[=:]\s*(\d{2,3})'
        
        for thinking in self.thinking_data:
            matches = re.findall(score_pattern, thinking['content'], re.IGNORECASE)
            
            for match in matches:
                score = match[0] or match[1]
                if score:
                    scores_data.append({
                        'file': thinking['file'],
                        'stage': thinking['stage'],
                        'round': thinking['round'],
                        'batch': thinking['batch'],
                        'extracted_score': int(score),
                        'context': self._extract_context(
                            thinking['content'], 
                            score
                        )
                    })
        
        return pd.DataFrame(scores_data)
    
    def _extract_context(self, text: str, target: str, window: int = 50) -> str:
        """Extract context around a target string"""
        idx = text.find(str(target))
        if idx == -1:
            return ''
        
        start = max(0, idx - window)
        end = min(len(text), idx + window)
        return text[start:end]
```

---

## Phase 4: Performance & Pipeline Analysis

### 4.1 Pipeline Performance Metrics

```python
# notebooks/04_performance.ipynb
import time
from datetime import datetime, timedelta

class PipelinePerformanceAnalyzer:
    """Analyze BTR pipeline performance"""
    
    def __init__(self, stages_data: Dict[str, pd.DataFrame]):
        self.stages = stages_data
    
    def calculate_stage_metrics(self) -> pd.DataFrame:
        """Calculate comprehensive stage metrics"""
        metrics = []
        
        for stage_name, df in self.stages.items():
            if 'timestamp' not in df.columns:
                continue
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            stage_metrics = {
                'stage': stage_name,
                'total_records': len(df),
                'start_time': df['timestamp'].min(),
                'end_time': df['timestamp'].max(),
                'duration_seconds': (
                    df['timestamp'].max() - df['timestamp'].min()
                ).total_seconds(),
                'unique_batches': df.get('batch', pd.Series()).nunique(),
                'unique_rounds': df.get('round', pd.Series()).nunique(),
                'records_per_second': len(df) / max(
                    (df['timestamp'].max() - df['timestamp'].min()).total_seconds(),
                    1
                )
            }
            
            # AI-specific metrics
            if 'thinkingLength' in df.columns:
                stage_metrics.update({
                    'avg_thinking_length': df['thinkingLength'].mean(),
                    'max_thinking_length': df['thinkingLength'].max(),
                    'min_thinking_length': df['thinkingLength'].min(),
                    'total_thinking_chars': df['thinkingLength'].sum()
                })
            
            if 'score' in df.columns:
                stage_metrics.update({
                    'avg_score': df['score'].mean(),
                    'score_std': df['score'].std(),
                    'min_score': df['score'].min(),
                    'max_score': df['score'].max()
                })
            
            metrics.append(stage_metrics)
        
        return pd.DataFrame(metrics)
    
    def analyze_batch_efficiency(self) -> pd.DataFrame:
        """Analyze batch processing efficiency"""
        efficiency_data = []
        
        for stage_name, df in self.stages.items():
            if 'batch' not in df.columns or 'timestamp' not in df.columns:
                continue
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            for batch_id in df['batch'].unique():
                batch_df = df[df['batch'] == batch_id]
                
                efficiency_data.append({
                    'stage': stage_name,
                    'batch': batch_id,
                    'records': len(batch_df),
                    'start_time': batch_df['timestamp'].min(),
                    'end_time': batch_df['timestamp'].max(),
                    'duration_seconds': (
                        batch_df['timestamp'].max() - 
                        batch_df['timestamp'].min()
                    ).total_seconds(),
                    'records_per_second': len(batch_df) / max(
                        (batch_df['timestamp'].max() - 
                         batch_df['timestamp'].min()).total_seconds(),
                        1
                    )
                })
        
        return pd.DataFrame(efficiency_data)
    
    def identify_bottlenecks(self) -> List[Dict]:
        """Identify pipeline bottlenecks"""
        metrics = self.calculate_stage_metrics()
        bottlenecks = []
        
        # Find stages with longest duration
        longest_stages = metrics.nlargest(3, 'duration_seconds')
        for _, row in longest_stages.iterrows():
            bottlenecks.append({
                'type': 'duration',
                'stage': row['stage'],
                'value': row['duration_seconds'],
                'unit': 'seconds',
                'severity': 'high' if row['duration_seconds'] > 300 else 'medium'
            })
        
        # Find stages with lowest throughput
        low_throughput = metrics.nsmallest(3, 'records_per_second')
        for _, row in low_throughput.iterrows():
            bottlenecks.append({
                'type': 'throughput',
                'stage': row['stage'],
                'value': row['records_per_second'],
                'unit': 'records/second',
                'severity': 'high' if row['records_per_second'] < 0.1 else 'medium'
            })
        
        return bottlenecks
    
    def create_performance_dashboard(self) -> None:
        """Create comprehensive performance dashboard"""
        metrics = self.calculate_stage_metrics()
        batch_efficiency = self.analyze_batch_efficiency()
        
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=[
                'Stage Duration',
                'Records per Second by Stage',
                'Batch Processing Time Distribution',
                'Score Distribution by Stage',
                'Thinking Length Distribution',
                'Timeline View'
            ]
        )
        
        # Stage duration bar chart
        fig.add_trace(
            go.Bar(
                x=metrics['stage'],
                y=metrics['duration_seconds'],
                name='Duration (s)'
            ),
            row=1, col=1
        )
        
        # Throughput
        fig.add_trace(
            go.Bar(
                x=metrics['stage'],
                y=metrics['records_per_second'],
                name='Records/s'
            ),
            row=1, col=2
        )
        
        # Batch processing time
        fig.add_trace(
            go.Box(
                x=batch_efficiency['stage'],
                y=batch_efficiency['duration_seconds'],
                name='Batch Time'
            ),
            row=2, col=1
        )
        
        # Score distribution
        for stage_name, df in self.stages.items():
            if 'score' in df.columns:
                fig.add_trace(
                    go.Histogram(
                        x=df['score'],
                        name=f'{stage_name} Scores',
                        opacity=0.6
                    ),
                    row=2, col=2
                )
        
        fig.update_layout(height=1200, showlegend=True)
        fig.write_html("outputs/dashboards/performance_dashboard.html")
```

---

## Phase 5: Advanced Analytics

### 5.1 Statistical Analysis

```python
# src/analyzers/statistical.py
from scipy.stats import (
    normaltest, shapiro, kstest,
    ttest_ind, mannwhitneyu, chi2_contingency,
    pearsonr, spearmanr
)
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.regression.linear_model import OLS
from statsmodels.tools import add_constant

class StatisticalAnalyzer:
    """Advanced statistical analysis of BTR data"""
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
    
    def normality_tests(self, column: str) -> Dict:
        """Test if data follows normal distribution"""
        data = self.df[column].dropna()
        
        # Shapiro-Wilk test (best for small samples)
        if len(data) <= 5000:
            shapiro_stat, shapiro_p = shapiro(data)
        else:
            shapiro_stat, shapiro_p = None, None
        
        # D'Agostino and Pearson's test
        dagostino_stat, dagostino_p = normaltest(data)
        
        # Kolmogorov-Smirnov test
        ks_stat, ks_p = kstest(data, 'norm', args=(data.mean(), data.std()))
        
        return {
            'shapiro': {
                'statistic': shapiro_stat,
                'p_value': shapiro_p,
                'is_normal': shapiro_p > 0.05 if shapiro_p else None
            },
            'dagostino': {
                'statistic': dagostino_stat,
                'p_value': dagostino_p,
                'is_normal': dagostino_p > 0.05
            },
            'kolmogorov_smirnov': {
                'statistic': ks_stat,
                'p_value': ks_p,
                'is_normal': ks_p > 0.05
            }
        }
    
    def compare_stages(self, stage1_data: pd.Series, 
                       stage2_data: pd.Series) -> Dict:
        """Statistically compare two stages"""
        # T-test (parametric)
        t_stat, t_p = ttest_ind(stage1_data.dropna(), stage2_data.dropna())
        
        # Mann-Whitney U test (non-parametric)
        u_stat, u_p = mannwhitneyu(
            stage1_data.dropna(), 
            stage2_data.dropna(),
            alternative='two-sided'
        )
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(
            (stage1_data.var() + stage2_data.var()) / 2
        )
        cohens_d = (stage1_data.mean() - stage2_data.mean()) / pooled_std
        
        return {
            't_test': {
                'statistic': t_stat,
                'p_value': t_p,
                'significant': t_p < 0.05
            },
            'mann_whitney': {
                'statistic': u_stat,
                'p_value': u_p,
                'significant': u_p < 0.05
            },
            'effect_size': {
                'cohens_d': cohens_d,
                'interpretation': self._interpret_cohens_d(cohens_d)
            }
        }
    
    def _interpret_cohens_d(self, d: float) -> str:
        """Interpret Cohen's d effect size"""
        abs_d = abs(d)
        if abs_d < 0.2:
            return 'negligible'
        elif abs_d < 0.5:
            return 'small'
        elif abs_d < 0.8:
            return 'medium'
        else:
            return 'large'
    
    def correlation_analysis(self, cols: List[str]) -> pd.DataFrame:
        """Comprehensive correlation analysis"""
        data = self.df[cols].dropna()
        
        # Pearson correlation
        pearson_corr = data.corr(method='pearson')
        
        # Spearman correlation (rank-based)
        spearman_corr = data.corr(method='spearman')
        
        # Kendall correlation
        kendall_corr = data.corr(method='kendall')
        
        return {
            'pearson': pearson_corr,
            'spearman': spearman_corr,
            'kendall': kendall_corr
        }
    
    def regression_analysis(self, x_col: str, y_col: str) -> Dict:
        """Perform OLS regression analysis"""
        data = self.df[[x_col, y_col]].dropna()
        
        X = add_constant(data[x_col])
        y = data[y_col]
        
        model = OLS(y, X).fit()
        
        return {
            'r_squared': model.rsquared,
            'adjusted_r_squared': model.rsquared_adj,
            'f_statistic': model.fvalue,
            'f_pvalue': model.f_pvalue,
            'coefficients': model.params.to_dict(),
            'pvalues': model.pvalues.to_dict(),
            'aic': model.aic,
            'bic': model.bic,
            'summary': str(model.summary())
        }
```

---

## Phase 6: Reporting & Visualization

### 6.1 Automated Report Generation

```python
# src/reporting/generator.py
from jinja2 import Template
import base64
from io import BytesIO

class ReportGenerator:
    """Generate comprehensive analysis reports"""
    
    def __init__(self, output_dir: str = "outputs/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_full_report(self, 
                            eda_results: Dict,
                            performance_metrics: pd.DataFrame,
                            ai_analysis: Dict,
                            ephemeris_analysis: Dict) -> str:
        """Generate comprehensive HTML report"""
        
        template_str = """
<!DOCTYPE html>
<html>
<head>
    <title>BTR Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .metric { display: inline-block; margin: 10px; padding: 15px; 
                  background: #ecf0f1; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2980b9; }
    </style>
</head>
<body>
    <h1>🔱 BTR Data Analysis Report</h1>
    <p>Generated on: {{ timestamp }}</p>
    
    <h2>Executive Summary</h2>
    <div class="metric">
        <div class="metric-value">{{ total_files }}</div>
        <div>Total Files</div>
    </div>
    <div class="metric">
        <div class="metric-value">{{ total_size }}</div>
        <div>Data Size</div>
    </div>
    <div class="metric">
        <div class="metric-value">{{ total_stages }}</div>
        <div>Stages</div>
    </div>
    
    <h2>Performance Metrics</h2>
    {{ performance_table }}
    
    <h2>AI Behavior Analysis</h2>
    <h3>Prompt Complexity</h3>
    {{ prompt_stats }}
    
    <h3>Thinking Patterns</h3>
    {{ thinking_patterns }}
    
    <h2>Ephemeris Analysis</h2>
    {{ ephemeris_summary }}
    
    <h2>Key Findings</h2>
    <ul>
    {% for finding in findings %}
        <li>{{ finding }}</li>
    {% endfor %}
    </ul>
    
    <h2>Recommendations</h2>
    <ul>
    {% for rec in recommendations %}
        <li>{{ rec }}</li>
    {% endfor %}
    </ul>
</body>
</html>
"""
        
        template = Template(template_str)
        
        html_content = template.render(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            total_files=eda_results.get('total_files', 'N/A'),
            total_size=eda_results.get('total_size', 'N/A'),
            total_stages=eda_results.get('total_stages', 'N/A'),
            performance_table=performance_metrics.to_html(),
            prompt_stats=ai_analysis.get('prompt_stats', ''),
            thinking_patterns=ai_analysis.get('patterns', ''),
            ephemeris_summary=ephemeris_analysis.get('summary', ''),
            findings=self._generate_findings(eda_results, performance_metrics),
            recommendations=self._generate_recommendations(performance_metrics)
        )
        
        output_path = self.output_dir / "btr_analysis_report.html"
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        return str(output_path)
    
    def _generate_findings(self, eda_results: Dict, 
                          performance: pd.DataFrame) -> List[str]:
        """Generate key findings from analysis"""
        findings = []
        
        # Add findings based on data
        if not performance.empty:
            max_duration_stage = performance.loc[
                performance['duration_seconds'].idxmax()
            ]
            findings.append(
                f"Stage {max_duration_stage['stage']} took the longest "
                f"({max_duration_stage['duration_seconds']:.1f}s)"
            )
            
            if 'avg_score' in performance.columns:
                best_stage = performance.loc[
                    performance['avg_score'].idxmax()
                ]
                findings.append(
                    f"Stage {best_stage['stage']} had the highest "
                    f"average score ({best_stage['avg_score']:.2f})"
                )
        
        return findings
    
    def _generate_recommendations(self, performance: pd.DataFrame) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if not performance.empty:
            slow_stages = performance[
                performance['records_per_second'] < 0.1
            ]
            if not slow_stages.empty:
                recommendations.append(
                    "Consider optimizing stages with low throughput: "
                    + ", ".join(slow_stages['stage'].tolist())
                )
        
        recommendations.extend([
            "Implement caching for repeated ephemeris calculations",
            "Add parallel processing for independent batches",
            "Monitor AI thinking length for potential token optimization"
        ])
        
        return recommendations
```

---

## Phase 7: Implementation Guide

### 7.1 Execution Order

```bash
# Step 1: Setup environment
python -m venv btr-analysis-env
source btr-analysis-env/bin/activate
pip install -r requirements.txt

# Step 2: Data ingestion
python src/data_loader.py

# Step 3: Run quality checks
python src/validators.py

# Step 4: Execute notebooks in order
jupyter notebook notebooks/01_eda.ipynb
jupyter notebook notebooks/02_ephemeris.ipynb
jupyter notebook notebooks/03_ai_behavior.ipynb
jupyter notebook notebooks/04_performance.ipynb
jupyter notebook notebooks/05_final_report.ipynb

# Step 5: Generate final report
python src/reporting/generator.py
```

### 7.2 Requirements File

```txt
# requirements.txt
pandas>=1.5.0
numpy>=1.21.0
matplotlib>=3.5.0
seaborn>=0.12.0
plotly>=5.0.0
scipy>=1.9.0
scikit-learn>=1.1.0
textstat>=0.7.0
nltk>=3.7
wordcloud>=1.8.0
jupyter>=1.0.0
jupyterlab>=3.0.0
great-expectations>=0.15.0
jsonlines>=3.0.0
jinja2>=3.0.0
pyyaml>=6.0
statsmodels>=0.13.0
```

### 7.3 Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Data Ingestion | 30 min | None |
| Quality Checks | 15 min | Phase 1 |
| EDA | 2-3 hours | Phase 1 |
| Ephemeris Analysis | 3-4 hours | Phase 1 |
| AI Behavior Analysis | 4-5 hours | Phase 1 |
| Performance Analysis | 2 hours | Phase 1 |
| Statistical Analysis | 2-3 hours | Phase 3-5 |
| Report Generation | 1 hour | All phases |
| **Total** | **16-20 hours** | - |

---

## Conclusion

This analysis plan provides a comprehensive, industry-standard approach to analyzing 909MB of BTR data. It includes:

1. **Scalable data infrastructure** with parallel processing
2. **Rigorous data validation** using Great Expectations
3. **Multi-dimensional analysis** (EDA, astrological, AI behavior, performance)
4. **Statistical rigor** with hypothesis testing and effect sizes
5. **Production-quality visualizations** with interactive dashboards
6. **Automated reporting** for stakeholder communication

The plan follows best practices from data science, MLOps, and software engineering to ensure reproducible, scalable, and insightful analysis.
