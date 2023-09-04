import React, { useEffect, useRef } from 'react';
import kebabCase from 'lodash/kebabCase';
import { Link, useStaticQuery, graphql } from 'gatsby';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import { srConfig } from '@config';
import sr from '@utils/sr';
import { IconBookmark } from '@components/icons';
import { usePrefersReducedMotion } from '@hooks';

const StyledPostsSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;

  h2 {
    font-size: clamp(24px, 5vw, var(--fz-heading));
  }

  .posts-grid {
    ${({ theme }) => theme.mixins.resetList};
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-gap: 15px;
    position: relative;
    margin-top: 50px;

    @media (max-width: 1080px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  .all-button {
    ${({ theme }) => theme.mixins.button};
    margin: 80px auto 0;
  }
`;

const StyledPost = styled.li`
  position: relative;
  cursor: default;
  transition: var(--transition);

  @media (prefers-reduced-motion: no-preference) {
    &:hover,
    &:focus-within {
      .post-inner {
        transform: translateY(-7px);
      }
    }
  }

  a {
    position: relative;
    z-index: 1;
  }

  .post-inner {
    ${({ theme }) => theme.mixins.boxShadow};
    ${({ theme }) => theme.mixins.flexBetween};
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    height: 100%;
    padding: 2rem 1.75rem;
    border-radius: var(--border-radius);
    background-color: var(--light-navy);
    transition: var(--transition);
    overflow: auto;
  }

  .post-icon {
    ${({ theme }) => theme.mixins.flexBetween};
    color: var(--green);
    margin-bottom: 30px;
    margin-left: -5px;

    svg {
      width: 40px;
      height: 40px;
    }
  }

  .post-title {
    margin: 0 0 10px;
    color: var(--lightest-slate);
    font-size: var(--fz-xxl);

    a {
      position: static;

      &:before {
        content: '';
        display: block;
        position: absolute;
        z-index: 0;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }
    }
  }

  .post-description {
    color: var(--light-slate);
    font-size: 17px;

    a {
      ${({ theme }) => theme.mixins.inlineLink};
    }
  }

  footer {
    ${({ theme }) => theme.mixins.flexBetween};
    width: 100%;
    margin-top: 20px;
  }

  .post-date {
    color: var(--light-slate);
    font-family: var(--font-mono);
    font-size: var(--fz-xxs);
    text-transform: uppercase;
  }

  ul.post-tags {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      color: var(--green);
      font-family: var(--font-mono);
      font-size: var(--fz-xxs);
      line-height: 1.75;

      &:not(:last-of-type) {
        margin-right: 15px;
      }
    }
  }
`;

const Posts = () => {
  const data = useStaticQuery(graphql`
    query {
      posts: allMarkdownRemark(
        filter: {
          fileAbsolutePath: { regex: "/content/posts/" }
          frontmatter: { draft: { ne: true } }
        }
        sort: { fields: [frontmatter___date], order: DESC }
      ) {
        edges {
          node {
            frontmatter {
              title
              description
              date
              tags
              slug
            }
          }
        }
      }
    }
  `);

  const revealTitle = useRef(null);
  const revealArchiveLink = useRef(null);
  const revealPosts = useRef([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    sr.reveal(revealTitle.current, srConfig());
    sr.reveal(revealArchiveLink.current, srConfig());
    revealPosts.current.forEach((ref, i) => sr.reveal(ref, srConfig(i * 100)));
  }, []);

  const GRID_LIMIT = 3;
  const posts = data.posts.edges.filter(({ node }) => node);
  const recentPosts = posts.slice(0, GRID_LIMIT);

  const postInner = node => {
    const { frontmatter } = node;
    const { title, description, date, tags, slug } = frontmatter;
    const formattedDate = new Date(date).toLocaleDateString();

    return (
      <div className="post-inner">
        <header>
          <div className="post-icon">
            <IconBookmark />
          </div>

          <h3 className="post-title">
            <a href={slug} target="_blank" rel="noreferrer">
              {title}
            </a>
          </h3>

          <p className="post-description">{description}</p>
        </header>

        <footer>
          <span className="post-date">{formattedDate}</span>
          <ul className="post-tags">
            {tags.map((tag, i) => (
              <li key={i}>
                <Link to={`/pensieve/tags/${kebabCase(tag)}/`} className="inline-link">
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    );
  };

  return (
    <StyledPostsSection id="posts">
      <h2 className="numbered-heading" ref={revealTitle}>
        Some posts I wrote recently
      </h2>

      <ul className="posts-grid">
        {prefersReducedMotion ? (
          <>
            {recentPosts &&
              recentPosts.map(({ node }, i) => <StyledPost key={i}>{postInner(node)}</StyledPost>)}
          </>
        ) : (
          <TransitionGroup component={null}>
            {recentPosts &&
              recentPosts.map(({ node }, i) => (
                <CSSTransition
                  key={i}
                  classNames="fadeup"
                  timeout={i >= GRID_LIMIT ? (i - GRID_LIMIT) * 300 : 300}
                  exit={false}>
                  <StyledPost
                    key={i}
                    ref={el => (revealPosts.current[i] = el)}
                    style={{
                      transitionDelay: `${i >= GRID_LIMIT ? (i - GRID_LIMIT) * 100 : 0}ms`,
                    }}>
                    {postInner(node)}
                  </StyledPost>
                </CSSTransition>
              ))}
          </TransitionGroup>
        )}
      </ul>

      <a href="/pensieve">
        <button className="all-button">Check out all posts</button>
      </a>
    </StyledPostsSection>
  );
};

export default Posts;
