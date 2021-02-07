const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

async function paginate({ graphql, actions, type }) {

  const newsPage = path.resolve(`./src/pages/news.jsx`);
  const result = await graphql(
    `
      {
        allMarkdownRemark(sort: {order: DESC, fields: [frontmatter___date]}, limit: 1000, filter: {frontmatter: {posttype: {eq: "${type}"}}}) {
          totalCount
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
                posttype
              }
            }
          }
        }
      }
    `
  );

  console.log("Result is coming:");
  console.log(result);

  if (result.errors) {
    throw result.errors;
  }

  const { totalCount } = result.data.allMarkdownRemark;
  const pages = Math.ceil(totalCount / 3);

  Array.from({ length: pages }).forEach((_, i) =>{
    //Dynamically create for each page
    actions.createPage({
      path: i === 0 ? `/news/` : `/news/${i + 1}`,
      component: newsPage,
      context: {
        skip: i * 3,
        currentPage: i + 1,
      }
    })
  })
}

async function createPostsFromMdx({ graphql, actions }) {

}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const blogPost = path.resolve(`./src/templates/blog-post.jsx`);
  const pressLinkTemplate = path.resolve(`./src/templates/project-post.jsx`);
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: ASC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
                date
                posttype
              }
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    throw result.errors;
  }

  await Promise.all([
    paginate({ graphql, actions, type: 'news' }),
  ]);

  result.data.allMarkdownRemark.edges.forEach((edge) => {
    console.log(edge.node.frontmatter.posttype);
    if (edge.node.frontmatter.posttype === 'press') {
      createPage({
        path: edge.node.fields.slug,
        component: blogPost,
        context: {
          slug: edge.node.fields.slug,
        },
      });
    // if (edge.node.frontmatter.posttype !== 'news')
    } else {
      createPage({
        path: edge.node.fields.slug,
        component: blogPost,
        context: {
          slug: edge.node.fields.slug,
        },
      });
    }
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value: `/news${value}`,
    });
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type SiteSiteMetadata {
      siteUrl: String
      name: String
      title: String
      description: String
    }

    type SectionItem {
      name: String!
      description: String!
      link: String!
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
      url: String
    }

    type Fields {
      slug: String
    }
  `;
  createTypes(typeDefs);
};
